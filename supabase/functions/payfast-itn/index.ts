
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";
import { createHash } from "node:crypto";

// ------------------------------------------------------------
// ENVIRONMENT
// ------------------------------------------------------------

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment configuration.");
}

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

// ------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------

const VALIDATION_URLS = {
  test: "https://sandbox.payfast.co.za/eng/query/validate",
  live: "https://www.payfast.co.za/eng/query/validate",
} as const;

const PAYFAST_IP_RANGES = [
  "197.97.145.144/28",
  "41.74.179.192/27",
  "102.216.36.0/28",
  "102.216.36.128/28",
  "144.126.193.139/32",
] as const;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PaymentMode = "test" | "live";
type ItnEntry = [string, string];

type PayFastConfig = {
  merchant_id: string;
  merchant_key: string;
  passphrase: string;
  mode: string;
};

type PayFastOrder = {
  id: string;
  business_id: string;
  order_number: number;
  total: number | string;
  payment_method: string | null;
  payment_status: string;
  payment_gross: number | string | null;
  payment_commission: number | string | null;
  payment_restaurant_amount: number | string | null;
};

// ------------------------------------------------------------
// RESPONSE
// ------------------------------------------------------------

function response(
  message: string,
  status = 200,
): Response {
  return new Response(message, {
    status,
    headers: corsHeaders,
  });
}

// ------------------------------------------------------------
// PAYFAST SOURCE IP VERIFICATION
// ------------------------------------------------------------

function ipv4ToNumber(ip: string): number | null {
  const parts = ip.split(".");

  if (parts.length !== 4) {
    return null;
  }

  const octets = parts.map(Number);

  if (
    octets.some(
      (value, index) =>
        !Number.isInteger(value) ||
        value < 0 ||
        value > 255 ||
        parts[index] !== String(value),
    )
  ) {
    return null;
  }

  return (
    (
      octets[0] * 0x1000000 +
      octets[1] * 0x10000 +
      octets[2] * 0x100 +
      octets[3]
    ) >>> 0
  );
}

function isIpInCidr(
  ip: string,
  cidr: string,
): boolean {
  const [network, prefixText] = cidr.split("/");
  const ipNumber = ipv4ToNumber(ip);
  const networkNumber = ipv4ToNumber(network);
  const prefix = Number(prefixText);

  if (
    ipNumber === null ||
    networkNumber === null ||
    !Number.isInteger(prefix) ||
    prefix < 0 ||
    prefix > 32
  ) {
    return false;
  }

  const mask =
    prefix === 0
      ? 0
      : (0xffffffff << (32 - prefix)) >>> 0;

  return (
    (ipNumber & mask) ===
    (networkNumber & mask)
  );
}

function isPayFastIp(ip: string): boolean {
  return PAYFAST_IP_RANGES.some((range) =>
    isIpInCidr(ip, range)
  );
}

function verifyPayFastSourceIp(
  req: Request,
): boolean {
  // Supabase's Cloudflare gateway provides this header.
  // Do not fall back to arbitrary X-Forwarded-For values.
  const sourceIp =
    req.headers.get("cf-connecting-ip")?.trim() ?? "";

  if (!sourceIp) {
    console.error(
      "PayFast ITN rejected: source IP header unavailable.",
    );
    return false;
  }

  if (!isPayFastIp(sourceIp)) {
    console.error(
      "PayFast ITN rejected: source IP not allowlisted.",
    );
    return false;
  }

  return true;
}

// ------------------------------------------------------------
// PAYFAST URL ENCODING
// ------------------------------------------------------------

function encodePayFastValue(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    )
    .replace(/~/g, "%7E");
}

// ------------------------------------------------------------
// ITN SIGNATURE
// ------------------------------------------------------------

function buildSignatureParameterString(
  entries: ItnEntry[],
  passphrase: string,
): string {
  const parts: string[] = [];

  for (const [key, value] of entries) {
    if (key === "signature") {
      break;
    }

    // Preserve original ITN field order and values.
    parts.push(
      `${key}=${encodePayFastValue(value)}`
    );
  }

  let parameterString = parts.join("&");

  if (passphrase !== "") {
    parameterString +=
      `${parameterString ? "&" : ""}passphrase=${encodePayFastValue(passphrase)}`;
  }

  return parameterString;
}

function generateSignature(
  entries: ItnEntry[],
  passphrase: string,
): string {
  return createHash("md5")
    .update(
      buildSignatureParameterString(entries, passphrase),
      "utf8",
    )
    .digest("hex")
    .toLowerCase();
}

function signaturesMatch(
  received: string,
  expected: string,
): boolean {
  if (
    !/^[a-f0-9]{32}$/i.test(received) ||
    !/^[a-f0-9]{32}$/i.test(expected)
  ) {
    return false;
  }

  const left = received.toLowerCase();
  const right = expected.toLowerCase();

  let difference = 0;

  for (let index = 0; index < 32; index++) {
    difference |=
      left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}

// ------------------------------------------------------------
// ITN SERVER VALIDATION PARAMETER STRING
// ------------------------------------------------------------

function buildValidationParameterString(
  entries: ItnEntry[],
): string {
  const parts: string[] = [];

  for (const [key, value] of entries) {
    if (key === "signature") {
      break;
    }

    parts.push(
      `${key}=${encodePayFastValue(value)}`
    );
  }

  return parts.join("&");
}

// ------------------------------------------------------------
// AMOUNT VALIDATION
// ------------------------------------------------------------

function validAmount(
  received: string,
  expected: number | string | null,
): boolean {
  const receivedAmount = Number(received);
  const expectedAmount = Number(expected);

  if (
    received.trim() === "" ||
    expected === null ||
    !Number.isFinite(receivedAmount) ||
    !Number.isFinite(expectedAmount) ||
    receivedAmount <= 0 ||
    expectedAmount <= 0
  ) {
    return false;
  }

  return (
    Math.round(receivedAmount * 100) ===
    Math.round(expectedAmount * 100)
  );
}

// ------------------------------------------------------------
// LOAD BUSINESS PAYFAST CONFIGURATION
// ------------------------------------------------------------

async function loadPayFastConfig(
  businessId: string,
): Promise<PayFastConfig | null> {
  const { data, error } = await supabaseAdmin.rpc(
    "get_business_payfast_config",
    {
      p_business_id: businessId,
    },
  );

  if (error || !data) {
    console.error(
      "PayFast configuration lookup failed.",
    );
    return null;
  }

  const config = (
    Array.isArray(data) ? data[0] : data
  ) as PayFastConfig | null;

  if (
    !config ||
    !config.merchant_id ||
    typeof config.passphrase !== "string" ||
    !config.mode
  ) {
    return null;
  }

  return config;
}

// ------------------------------------------------------------
// PARSE PAYFAST ITN
// ------------------------------------------------------------

async function parseItn(
  req: Request,
): Promise<ItnEntry[]> {
  const contentType =
    req.headers.get("content-type")?.toLowerCase() ?? "";

  const entries: ItnEntry[] = [];

  if (
    contentType.startsWith(
      "application/x-www-form-urlencoded",
    )
  ) {
    const rawBody = await req.text();

    if (rawBody.length > 65536) {
      throw new Error("ITN payload too large.");
    }

    const form = new URLSearchParams(rawBody);

    for (const [key, value] of form.entries()) {
      entries.push([key, value]);
    }
  } else if (
    contentType.startsWith("multipart/form-data")
  ) {
    const form = await req.formData();

    for (const [key, value] of form.entries()) {
      if (typeof value === "string") {
        entries.push([key, value]);
      }
    }
  } else {
    throw new Error("Unsupported ITN content type.");
  }

  if (entries.length === 0 || entries.length > 100) {
    throw new Error("Invalid ITN payload.");
  }

  const seenKeys = new Set<string>();

  for (const [key] of entries) {
    if (!key || seenKeys.has(key)) {
      throw new Error("Duplicate or invalid ITN field.");
    }

    seenKeys.add(key);
  }

  const signatureIndex = entries.findIndex(
    ([key]) => key === "signature",
  );

  if (
    signatureIndex === -1 ||
    signatureIndex !== entries.length - 1
  ) {
    throw new Error("Missing or misplaced signature.");
  }

  return entries;
}

// ------------------------------------------------------------
// VALIDATE NOTIFICATION WITH PAYFAST
// ------------------------------------------------------------

async function validateWithPayFast(
  entries: ItnEntry[],
  mode: PaymentMode,
): Promise<boolean> {
  const parameterString =
    buildValidationParameterString(entries);

  const validationResponse = await fetch(
    VALIDATION_URLS[mode],
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: parameterString,
      signal: AbortSignal.timeout(15000),
    },
  );

  if (!validationResponse.ok) {
    console.error(
      "PayFast validation HTTP error:",
      validationResponse.status,
    );

    return false;
  }

  const validationText = (
    await validationResponse.text()
  ).trim();

  return validationText === "VALID";
}

// ------------------------------------------------------------
// RECORDED PAYMENT ID
// ------------------------------------------------------------

async function getRecordedPaymentId(
  orderId: string,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("payfast_payment_id")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data?.payfast_payment_id ?? null;
}

// ------------------------------------------------------------
// MAIN ITN HANDLER
// ------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return response("Method not allowed", 405);
  }

  try {
    // STEP 1: Verify PayFast source IP.

    if (!verifyPayFastSourceIp(req)) {
      return response("Forbidden source IP", 403);
    }

    // STEP 2: Parse notification.

    const entries = await parseItn(req);

    const data: Record<string, string> = {};

    for (const [key, value] of entries) {
      data[key] = value;
    }

    const paymentId = data.m_payment_id;
    const receivedSignature = data.signature;
    const merchantId = data.merchant_id;
    const paymentStatus = data.payment_status;
    const payfastPaymentId = data.pf_payment_id;

    if (
      !paymentId ||
      !receivedSignature ||
      !merchantId ||
      !paymentStatus
    ) {
      return response("Missing required ITN fields", 400);
    }

    // STEP 3: Find order using PayFast payment ID.

    const {
      data: orderData,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .select(
        [
          "id",
          "business_id",
          "order_number",
          "total",
          "payment_method",
          "payment_status",
          "payment_gross",
          "payment_commission",
          "payment_restaurant_amount",
        ].join(", "),
      )
      .eq("id", paymentId)
      .maybeSingle();

    if (orderError) {
      console.error("ITN order lookup failed.");
      return response("Order lookup failed", 500);
    }

    const order = orderData as PayFastOrder | null;

    if (!order) {
      return response("Order not found", 404);
    }

    if (order.payment_method !== "online") {
      return response("Invalid payment method", 400);
    }

    // STEP 4: Load merchant configuration.

    const config = await loadPayFastConfig(
      order.business_id,
    );

    if (!config) {
      return response(
        "PayFast configuration unavailable",
        500,
      );
    }

    if (
      config.mode !== "test" &&
      config.mode !== "live"
    ) {
      return response("Invalid payment mode", 500);
    }

    const mode: PaymentMode = config.mode;

    // STEP 5: Verify merchant ID.

    const expectedMerchantId =
      String(config.merchant_id).trim();

    if (
      !expectedMerchantId ||
      merchantId.trim() !== expectedMerchantId
    ) {
      console.error("PayFast merchant ID mismatch.");
      return response("Merchant ID mismatch", 400);
    }

    // STEP 6: Verify ITN signature.

    const expectedSignature = generateSignature(
      entries,
      config.passphrase,
    );

    if (
      !signaturesMatch(
        receivedSignature,
        expectedSignature,
      )
    ) {
      console.error(
        "PayFast ITN signature verification failed.",
      );

      return response("Invalid signature", 400);
    }

    // STEP 7: Verify gross payment amount.

    if (
      !validAmount(
        data.amount_gross ?? "",
        order.payment_gross,
      )
    ) {
      console.error("PayFast ITN amount mismatch.");
      return response("Amount mismatch", 400);
    }

    // STEP 8: Validate notification with PayFast.

    const validated = await validateWithPayFast(
      entries,
      mode,
    );

    if (!validated) {
      console.error("PayFast server validation failed.");
      return response("PayFast validation failed", 400);
    }

    // STEP 9: Process successful payment.

    if (paymentStatus === "COMPLETE") {
      if (!payfastPaymentId?.trim()) {
        return response(
          "Missing PayFast transaction ID",
          400,
        );
      }

      if (order.payment_status === "paid") {
        const recordedPaymentId =
          await getRecordedPaymentId(order.id);

        if (recordedPaymentId === payfastPaymentId) {
          return response("OK", 200);
        }

        return response("Order already paid", 409);
      }

      if (order.payment_status !== "pending") {
        return response(
          "Order is not awaiting payment",
          409,
        );
      }

      // Verify stored payment split.

      const paymentGross = Number(order.payment_gross);
      const paymentCommission =
        Number(order.payment_commission);

      const restaurantAmount =
        Number(order.payment_restaurant_amount);

      if (
        !Number.isFinite(paymentGross) ||
        !Number.isFinite(paymentCommission) ||
        !Number.isFinite(restaurantAmount) ||
        paymentGross <= 0 ||
        paymentCommission < 0 ||
        restaurantAmount < 0 ||
        Math.round(
          (paymentCommission + restaurantAmount) * 100,
        ) !== Math.round(paymentGross * 100)
      ) {
        console.error("Recorded payment split is invalid.");

        return response(
          "Invalid recorded payment split",
          400,
        );
      }

      // Only pending orders can become paid.

      const completedAt = new Date().toISOString();

      const {
        data: updatedOrder,
        error: updateError,
      } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "paid",
          payfast_payment_id: payfastPaymentId,
          payfast_event_id: payfastPaymentId,
          payment_completed_at: completedAt,
          updated_at: completedAt,
        })
        .eq("id", order.id)
        .eq("payment_status", "pending")
        .select("id")
        .maybeSingle();

      if (updateError) {
        console.error(
          "Failed to record completed payment.",
        );

        return response("Could not update order", 500);
      }

      // Handle concurrent ITN notifications.

      if (!updatedOrder) {
        const {
          data: latestOrder,
          error: latestError,
        } = await supabaseAdmin
          .from("orders")
          .select("payment_status, payfast_payment_id")
          .eq("id", order.id)
          .maybeSingle();

        if (latestError) {
          return response(
            "Could not verify payment state",
            500,
          );
        }

        if (
          latestOrder?.payment_status === "paid" &&
          latestOrder.payfast_payment_id === payfastPaymentId
        ) {
          return response("OK", 200);
        }

        return response("Payment state conflict", 409);
      }

      console.log(
        "Verified PayFast payment completed for order:",
        order.order_number,
      );

      return response("OK", 200);
    }

    // STEP 10: Handle unsuccessful payments.

    if (
      paymentStatus === "FAILED" ||
      paymentStatus === "CANCELLED"
    ) {
      if (order.payment_status === "paid") {
        return response("OK", 200);
      }

      if (order.payment_status !== "pending") {
        return response("OK", 200);
      }

      const { error: updateError } =
        await supabaseAdmin
          .from("orders")
          .update({
            payment_status: "failed",
            payfast_payment_id: payfastPaymentId ?? null,
            payfast_event_id: payfastPaymentId ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id)
          .eq("payment_status", "pending");

      if (updateError) {
        console.error(
          "Failed to record unsuccessful payment.",
        );

        return response("Could not update order", 500);
      }

      return response("OK", 200);
    }

    // STEP 11: Acknowledge pending notifications.

    if (paymentStatus === "PENDING") {
      return response("OK", 200);
    }

    console.warn(
      "Unrecognised PayFast payment status:",
      paymentStatus,
    );

    return response("OK", 200);

  } catch (error) {
    console.error(
      "PayFast ITN processing error:",
      error instanceof Error
        ? error.message
        : "Unknown error",
    );

    return response("Internal server error", 500);
  }
});
