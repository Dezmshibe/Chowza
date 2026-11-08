import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";
import { createHash } from "node:crypto";

import {
  getCorsHeaders,
  requireCsrf,
} from "../_shared/csrf.ts";

import {
  calculatePaymentSplit,
  getConfiguredCommissionPercent,
} from "../_shared/payment-engine.ts";

// ------------------------------------------------------------
// ENVIRONMENT
// ------------------------------------------------------------

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase environment configuration.");
}

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------

type PayFastOrder = {
  id: string;
  business_id: string;
  order_number: number;
  total: number;
  payment_method: string | null;
  payment_status: string | null;
  payment_token_hash: string | null;
};

type PayFastConfig = {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  mode: "live" | "test";
};

type PayFastFieldMap = Record<string, string>;

type CreatePaymentRequest = {
  orderNumber?: number | string;
  paymentToken?: string;
};

// ------------------------------------------------------------
// RESPONSE HELPER
// ------------------------------------------------------------

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>,
): Response {
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

// ------------------------------------------------------------
// PAYMENT TOKEN SECURITY
// ------------------------------------------------------------

function hashPaymentToken(token: string): string {
  return createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}

// ------------------------------------------------------------
// PAYFAST SIGNATURE
// ------------------------------------------------------------

function payfastUrlEncode(value: string): string {
  return encodeURIComponent(value.trim())
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/~/g, "%7E")
    .replace(/\*/g, "%2A");
}

function generateSignature(
  data: PayFastFieldMap,
  passphrase: string,
): string {
  const parts: string[] = [];

  for (const [key, rawValue] of Object.entries(data)) {
    // PayFast's split-payment setup object is sent as a field but
    // is excluded from the standard form-field signature string.
    if (key === "setup" || rawValue === "" || rawValue === undefined) {
      continue;
    }

    parts.push(`${key}=${payfastUrlEncode(String(rawValue))}`);
  }

  parts.push(`passphrase=${payfastUrlEncode(passphrase)}`);

  return createHash("md5")
    .update(parts.join("&"))
    .digest("hex");
}

// ------------------------------------------------------------
// LOAD PAYFAST CONFIGURATION FROM SUPABASE VAULT
// ------------------------------------------------------------

async function loadPayFastConfig(
  businessId: string,
): Promise<PayFastConfig> {
  const { data, error } = await supabaseAdmin.rpc(
    "get_business_payfast_config",
    {
      p_business_id: businessId,
    },
  );

  if (error || !data) {
    console.error(
      "PayFast configuration lookup failed:",
      error?.message,
    );
    throw new Error(
      "Online payments are not configured for this business.",
    );
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result) {
    throw new Error(
      "Online payments are not configured for this business.",
    );
  }

  const row = result as Record<string, unknown>;

  const config: PayFastConfig = {
    merchantId: String(row.merchant_id ?? ""),
    merchantKey: String(row.merchant_key ?? ""),
    passphrase: String(row.passphrase ?? ""),
    mode: row.mode === "live" ? "live" : "test",
  };

  if (
    !/^\d+$/.test(config.merchantId) ||
    !config.merchantKey ||
    !config.passphrase
  ) {
    throw new Error(
      "The business payment account is incomplete or invalid.",
    );
  }

  return config;
}

// ------------------------------------------------------------
// MAIN EDGE FUNCTION
// ------------------------------------------------------------

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed." },
      405,
      corsHeaders,
    );
  }

  const csrfError = await requireCsrf(req);
  if (csrfError) {
    return csrfError;
  }

  try {
    // STEP 1: VALIDATE REQUEST

    let body: CreatePaymentRequest;

    try {
      body = (await req.json()) as CreatePaymentRequest;
    } catch {
      return jsonResponse(
        { error: "Invalid JSON request body." },
        400,
        corsHeaders,
      );
    }

    const orderNumber = Number(body.orderNumber);
    const paymentToken =
      typeof body.paymentToken === "string"
        ? body.paymentToken.trim()
        : "";

    if (!Number.isSafeInteger(orderNumber) || orderNumber <= 0) {
      return jsonResponse(
        { error: "Invalid order number." },
        400,
        corsHeaders,
      );
    }

    if (paymentToken.length < 32 || paymentToken.length > 512) {
      return jsonResponse(
        { error: "Missing or invalid payment authorisation token." },
        401,
        corsHeaders,
      );
    }

    const suppliedTokenHash = hashPaymentToken(paymentToken);

    // STEP 2: LOAD ORDER

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(
        [
          "id",
          "business_id",
          "order_number",
          "total",
          "payment_method",
          "payment_status",
          "payment_token_hash",
        ].join(", "),
      )
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (orderError) {
      console.error("Order lookup failed:", orderError.message);
      return jsonResponse(
        { error: "Could not load the order." },
        500,
        corsHeaders,
      );
    }

    const order = orderData as PayFastOrder | null;

    if (!order) {
      return jsonResponse(
        { error: "Order not found." },
        404,
        corsHeaders,
      );
    }

    // STEP 3: VERIFY PAYMENT AUTHORISATION TOKEN

    const storedTokenHash = String(order.payment_token_hash ?? "");

    if (
      !storedTokenHash ||
      !/^[a-f0-9]{64}$/i.test(storedTokenHash) ||
      suppliedTokenHash !== storedTokenHash.toLowerCase()
    ) {
      console.warn(
        "Rejected PayFast request: invalid payment token.",
        { orderNumber },
      );

      return jsonResponse(
        {
          error:
            "Payment authorisation failed. Please restart checkout.",
        },
        401,
        corsHeaders,
      );
    }

    // STEP 4: VERIFY PAYMENT METHOD AND STATUS

    if (order.payment_method !== "online") {
      return jsonResponse(
        { error: "This order is not an online payment order." },
        400,
        corsHeaders,
      );
    }

    if (order.payment_status === "paid") {
      return jsonResponse(
        { error: "This order has already been paid." },
        409,
        corsHeaders,
      );
    }

    const orderTotal = Number(order.total);

    if (!Number.isFinite(orderTotal) || orderTotal <= 0) {
      return jsonResponse(
        { error: "The order total is invalid for online payment." },
        400,
        corsHeaders,
      );
    }

    // STEP 5: VERIFY BUSINESS

    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("id, name")
      .eq("id", order.business_id)
      .eq("is_published", true)
      .maybeSingle();

    if (businessError || !business) {
      console.error(
        "Business payment lookup failed:",
        businessError?.message,
      );

      return jsonResponse(
        {
          error:
            "Could not verify this business for online payments.",
        },
        500,
        corsHeaders,
      );
    }

    // STEP 6: LOAD RESTAURANT MERCHANT CONFIGURATION FROM VAULT

    const config = await loadPayFastConfig(order.business_id);

    // Chowza is the secondary merchant receiving its commission.
    // The restaurant remains the primary merchant.
    const platformMerchantId =
      config.mode === "test"
        ? Deno.env.get("CHOWZA_PAYFAST_SANDBOX_MERCHANT_ID") ?? ""
        : Deno.env.get("CHOWZA_PAYFAST_MERCHANT_ID") ?? "";

    // Safe diagnostic: never log the actual merchant ID or credentials.
    console.log("PayFast configuration diagnostic:", {
      mode: config.mode,
      sandboxSecretExists:
        Boolean(Deno.env.get("CHOWZA_PAYFAST_SANDBOX_MERCHANT_ID")),
      liveSecretExists:
        Boolean(Deno.env.get("CHOWZA_PAYFAST_MERCHANT_ID")),
      selectedMerchantIdLength: platformMerchantId.length,
      selectedMerchantIdIsNumeric: /^\d+$/.test(platformMerchantId),
    });

    if (!/^\d+$/.test(platformMerchantId)) {
      console.error(
        "Chowza PayFast merchant ID is missing or invalid.",
      );

      return jsonResponse(
        {
          error:
            "Chowza online payments are not fully configured.",
        },
        500,
        corsHeaders,
      );
    }

    if (platformMerchantId === config.merchantId) {
      return jsonResponse(
        {
          error:
            "The Chowza and restaurant PayFast merchant accounts must be different.",
        },
        500,
        corsHeaders,
      );
    }
console.log("CHOWZA SPLIT RECIPIENT CHECK:", {
  matchesOrder122Recipient: platformMerchantId === "10054918",
  merchantIdLength: platformMerchantId.length,
});
    // STEP 7: CALCULATE PAYMENT SPLIT

    const commissionPercent = getConfiguredCommissionPercent(null);

    const split = calculatePaymentSplit(
      orderTotal,
      commissionPercent,
    );

    if (
      !Number.isFinite(split.grossAmount) ||
      !Number.isFinite(split.platformFee) ||
      !Number.isFinite(split.businessAmount) ||
      split.grossAmount <= 0 ||
      split.platformFee < 0 ||
      split.businessAmount < 0
    ) {
      throw new Error("The payment split calculation is invalid.");
    }

    // STEP 8: VALIDATE PAYMENT URLS

    const siteUrl = (
      Deno.env.get("PUBLIC_SITE_URL") ?? ""
    ).replace(/\/+$/, "");

    const supabaseUrl = SUPABASE_URL.replace(/\/+$/, "");

    if (!siteUrl || !/^https:\/\/[^/]+$/i.test(supabaseUrl)) {
      return jsonResponse(
        { error: "Payment URLs are not configured correctly." },
        500,
        corsHeaders,
      );
    }

    // STEP 9: SELECT PAYFAST ENVIRONMENT

    const processUrl =
      config.mode === "live"
        ? "https://www.payfast.co.za/eng/process"
        : "https://sandbox.payfast.co.za/eng/process";

    // STEP 10: CONFIGURE SPLIT PAYMENT
    //
    // Restaurant merchant credentials are used as the primary account.
    // Chowza's merchant ID is the secondary account receiving 5%.
    // Confirm this setup with PayFast before enabling live payments.

    const splitSetup = JSON.stringify({
      split_payment: {
        merchant_id: Number(platformMerchantId),
        percentage: split.commissionPercent,
      },
    });

    // STEP 11: BUILD PAYFAST FORM FIELDS

    const data: PayFastFieldMap = {
      merchant_id: config.merchantId,
      merchant_key: config.merchantKey,

      return_url:
        `${siteUrl}/payment/success?orderNumber=${order.order_number}`,

      cancel_url:
        `${siteUrl}/payment/cancelled?orderNumber=${order.order_number}`,

      notify_url:
        `${supabaseUrl}/functions/v1/payfast-itn`,

      name_first: "Chowza",
      name_last: "Customer",
      email_address: "payments@chowza.co.za",

      m_payment_id: String(order.id),

      amount: split.grossAmount.toFixed(2),

      item_name: `Chowza Order #${order.order_number}`,

      custom_str1: String(order.business_id),
      custom_str2: String(order.order_number),

      setup: splitSetup,
    };

    const signature = generateSignature(
      data,
      config.passphrase,
    );

    // STEP 12: SAVE PAYMENT CALCULATION BEFORE REDIRECTING

    const {
      data: updatedOrder,
      error: updateError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        payment_gross: split.grossAmount,
        payment_commission: split.platformFee,
        payment_restaurant_amount: split.businessAmount,
        payment_commission_percent: split.commissionPercent,
        payment_status: "pending",
      })
      .eq("id", order.id)
      .eq("payment_token_hash", suppliedTokenHash)
      .neq("payment_status", "paid")
      .select("id")
      .maybeSingle();

    if (updateError || !updatedOrder) {
      console.error(
        "Could not save payment engine state:",
        updateError?.message ?? "No matching order was updated.",
      );

      return jsonResponse(
        {
          error:
            "Could not initialise the payment. Please try again.",
        },
        500,
        corsHeaders,
      );
    }

    // STEP 13: RETURN PAYMENT INFORMATION TO THE CHECKOUT

    return jsonResponse(
      {
        success: true,
        engine: "chowza",
        provider: "payfast",
        mode: config.mode,
        orderNumber: order.order_number,
        amount: split.grossAmount,
        commission: split.platformFee,
        restaurantAmount: split.businessAmount,
        processUrl,
        fields: {
          ...data,
          signature,
        },
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("PAYMENT ENGINE FAILURE:", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "Unknown",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while preparing the online payment.",
      },
      500,
      corsHeaders,
    );
  }
});
