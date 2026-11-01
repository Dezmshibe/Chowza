import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createHash } from "node:crypto";
import { getCorsHeaders, requireCsrf } from "../_shared/csrf.ts";
import {
  calculatePaymentSplit,
  getConfiguredCommissionPercent,
} from "../_shared/payment-engine.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

type PayFastConfig = {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  mode: "live" | "test";
};

type PayFastFieldMap = Record<string, string>;

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
    if (rawValue === "" || rawValue === undefined) continue;
    parts.push(`${key}=${payfastUrlEncode(String(rawValue))}`);
  }

  parts.push(`passphrase=${payfastUrlEncode(passphrase)}`);

  return createHash("md5")
    .update(parts.join("&"))
    .digest("hex");
}

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

async function loadPayFastConfig(businessId: string): Promise<PayFastConfig> {
  const { data, error } = await supabaseAdmin.rpc(
    "get_business_payfast_config",
    { p_business_id: businessId },
  );

  if (error || !data) {
    console.error("PayFast config lookup failed:", error);
    throw new Error("Online payments are not configured for this business.");
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    throw new Error("Online payments are not configured for this business.");
  }

  const config: PayFastConfig = {
    merchantId: String(row.merchant_id ?? ""),
    merchantKey: String(row.merchant_key ?? ""),
    passphrase: String(row.passphrase ?? ""),
    mode: row.mode === "live" ? "live" : "test",
  };

  if (!config.merchantId || !config.merchantKey || !config.passphrase) {
    throw new Error("The business payment account is incomplete.");
  }

  return config;
}

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
  if (csrfError) return csrfError;

  try {
    const body = (await req.json()) as {
      orderNumber?: number | string;
    };

    const orderNumber = Number(body.orderNumber);

    if (!Number.isInteger(orderNumber) || orderNumber <= 0) {
      return jsonResponse(
        { error: "Invalid order number." },
        400,
        corsHeaders,
      );
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, business_id, order_number, total, payment_method, payment_status")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (orderError) {
      console.error("Order lookup failed:", orderError);
      return jsonResponse(
        { error: "Could not load the order." },
        500,
        corsHeaders,
      );
    }

    if (!order) {
      return jsonResponse(
        { error: "Order not found." },
        404,
        corsHeaders,
      );
    }

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

    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("id, name, payment_enabled, payment_provider, commission_percent")
      .eq("id", order.business_id)
      .eq("is_published", true)
      .maybeSingle();

    if (businessError || !business) {
      console.error("Business payment lookup failed:", businessError);
      return jsonResponse(
        { error: "Could not verify this business for online payments." },
        500,
        corsHeaders,
      );
    }

    if (business.payment_enabled === false) {
      return jsonResponse(
        { error: "Online payments are not enabled for this business." },
        400,
        corsHeaders,
      );
    }

    const provider = String(business.payment_provider ?? "payfast").toLowerCase();
    if (provider !== "payfast") {
      return jsonResponse(
        { error: `Payment provider '${provider}' is not enabled yet.` },
        400,
        corsHeaders,
      );
    }

    const config = await loadPayFastConfig(order.business_id);

    const platformMerchantId =
      Deno.env.get("CHOWZA_PAYFAST_MERCHANT_ID") ?? "";

    if (!platformMerchantId) {
      console.error("CHOWZA_PAYFAST_MERCHANT_ID is not configured.");
      return jsonResponse(
        { error: "Chowza online payments are not fully configured." },
        500,
        corsHeaders,
      );
    }

    const commissionPercent = getConfiguredCommissionPercent(
      business.commission_percent,
    );

    const split = calculatePaymentSplit(
      Number(order.total),
      commissionPercent,
    );

    const siteUrl = (
      Deno.env.get("PUBLIC_SITE_URL") ?? ""
    ).replace(/\/+$/, "");

    if (!siteUrl || !SUPABASE_URL) {
      return jsonResponse(
        { error: "Payment URLs are not configured." },
        500,
        corsHeaders,
      );
    }

    const processUrl =
      config.mode === "live"
        ? "https://www.payfast.co.za/eng/process"
        : "https://sandbox.payfast.co.za/eng/process";

    /*
     * PayFast Split Payments:
     * - the restaurant remains the primary PayFast merchant
     * - Chowza is the secondary split merchant
     * - the configured percentage is sent to Chowza
     * - the remaining amount stays with the restaurant
     *
     * This keeps the actual movement/settlement of funds with the
     * regulated payment partner rather than with Chowza's database.
     */
    const splitSetup = JSON.stringify({
      split_payment: {
        merchant_id: Number(platformMerchantId),
        percentage: split.commissionPercent,
      },
    });

    const data: PayFastFieldMap = {
      merchant_id: config.merchantId,
      merchant_key: config.merchantKey,
      return_url:
        `${siteUrl}/payment/success?orderNumber=${order.order_number}`,
      cancel_url:
        `${siteUrl}/payment/cancelled?orderNumber=${order.order_number}`,
      notify_url: `${SUPABASE_URL}/functions/v1/payfast-itn`,
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

    const signature = generateSignature(data, config.passphrase);

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        payment_provider: "payfast",
        payment_amount: split.grossAmount,
        platform_fee: split.platformFee,
        business_amount: split.businessAmount,
        payment_reference: String(order.id),
        payment_started_at: new Date().toISOString(),
        payment_status: "pending",
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("Could not save payment engine state:", updateError);
      return jsonResponse(
        { error: "Could not initialise the payment." },
        500,
        corsHeaders,
      );
    }

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
    console.error("Chowza payment engine error:", error);

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
