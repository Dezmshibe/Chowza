import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createHash } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PAYFAST_SANDBOX_VALIDATE_URL =
  "https://sandbox.payfast.co.za/eng/query/validate";

const PAYFAST_LIVE_VALIDATE_URL =
  "https://www.payfast.co.za/eng/query/validate";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
);

type PayFastConfig = {
  merchant_id: string;
  merchant_key: string;
  passphrase: string;
  mode: string;
};

/**
 * PayFast's ITN signature uses PHP-style urlencode:
 * - spaces become +
 * - percent encoding is uppercase
 * - the values are signed in the order PayFast posted them
 */
function payfastUrlEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/~/g, "%7E");
}

/**
 * Build the PayFast ITN parameter string.
 *
 * PayFast's ITN documentation builds this from the posted
 * variables in their received order, stopping at signature.
 * The signature itself is not included.
 */
function buildItnParameterString(
  entries: Array<[string, string]>,
): string {
  const parts: string[] = [];

  for (const [key, value] of entries) {
    if (key === "signature") {
      break;
    }

    parts.push(`${key}=${payfastUrlEncode(value)}`);
  }

  return parts.join("&");
}

function generateItnSignature(
  entries: Array<[string, string]>,
  passphrase: string,
): string {
  let parameterString = buildItnParameterString(entries);

  if (passphrase !== "") {
    parameterString +=
      `&passphrase=${payfastUrlEncode(passphrase)}`;
  }

 return createHash("md5")
  .update(parameterString, "utf8")
  .digest("hex")
  .toLowerCase();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const contentType =
      req.headers.get("content-type") ?? "";

    console.log(
      "ITN CONTENT-TYPE:",
      contentType,
    );

    if (!contentType) {
      return new Response("Missing content type", {
        status: 400,
        headers: corsHeaders,
      });
    }

    /*
     * PayFast has been observed sending both:
     * - multipart/form-data
     * - application/x-www-form-urlencoded
     *
     * We support both while preserving the received
     * field order for signature verification.
     */
    const entries: Array<[string, string]> = [];

    if (
      contentType
        .toLowerCase()
        .startsWith("multipart/form-data")
    ) {
      const formData = await req.formData();

      for (const [key, value] of formData.entries()) {
        if (typeof value === "string") {
          entries.push([key, value]);
        }
      }
    } else {
      const rawBody = await req.text();
      const form = new URLSearchParams(rawBody);

      for (const [key, value] of form.entries()) {
        entries.push([key, value]);
      }
    }

    if (entries.length === 0) {
      return new Response("Empty ITN payload", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const data: Record<string, string> = {};

    for (const [key, value] of entries) {
      data[key] = value;
    }

    console.log(
      "ITN FIELDS RECEIVED:",
      entries.map(([key]) => key),
    );

    console.log(
      "ITN m_payment_id:",
      data.m_payment_id ?? null,
    );

    console.log(
      "ITN pf_payment_id:",
      data.pf_payment_id ?? null,
    );

    console.log(
      "ITN payment_status:",
      data.payment_status ?? null,
    );

    console.log(
      "ITN merchant_id:",
      data.merchant_id ?? null,
    );

    console.log(
      "ITN amount_gross:",
      data.amount_gross ?? null,
    );

    /*
     * m_payment_id is the Chowza order UUID.
     */
    const paymentId = data.m_payment_id;

    if (!paymentId) {
      console.error("Missing m_payment_id.");

      return new Response("Missing payment ID", {
        status: 400,
        headers: corsHeaders,
      });
    }

    /*
     * Find the Chowza order.
     */
    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .select(
        "id, business_id, order_number, total, payment_method, payment_status, status",
      )
      .eq("id", paymentId)
      .maybeSingle();

    if (orderError) {
      console.error(
        "Order lookup failed:",
        orderError,
      );

      return new Response("Order lookup failed", {
        status: 500,
        headers: corsHeaders,
      });
    }

    if (!order) {
      console.error(
        "Order not found:",
        paymentId,
      );

      return new Response("Order not found", {
        status: 404,
        headers: corsHeaders,
      });
    }

    /*
     * Only online orders use PayFast.
     */
    if (order.payment_method !== "online") {
      console.error(
        "Order is not an online payment:",
        order.id,
      );

      return new Response("Invalid payment method", {
        status: 400,
        headers: corsHeaders,
      });
    }

    /*
     * Retrieve PayFast configuration from Vault-backed RPC.
     */
    const {
      data: config,
      error: configError,
    } = await supabaseAdmin.rpc(
      "get_business_payfast_config",
      {
        p_business_id: order.business_id,
      },
    );

    if (configError || !config) {
      console.error(
        "PayFast configuration lookup failed:",
        configError,
      );

      return new Response(
        "PayFast configuration unavailable",
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }

    const payfast: PayFastConfig =
      Array.isArray(config)
        ? config[0]
        : config;

    if (!payfast) {
      return new Response(
        "PayFast configuration unavailable",
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }

    const merchantId =
      String(payfast.merchant_id ?? "");

    const passphrase =
      String(payfast.passphrase ?? "");

    const mode =
      String(payfast.mode ?? "test");

    /*
     * Verify Merchant ID.
     */
    if (
      data.merchant_id &&
      data.merchant_id !== merchantId
    ) {
      console.error(
        "Merchant ID mismatch:",
        {
          received: data.merchant_id,
          expected: merchantId,
        },
      );

      return new Response(
        "Merchant ID mismatch",
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    /*
     * Verify that PayFast sent a signature.
     */
    const receivedSignature =
      data.signature ?? "";

    if (!receivedSignature) {
      console.error(
        "Missing PayFast signature.",
      );

      return new Response(
        "Missing signature",
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    /*
     * Calculate the expected ITN signature.
     *
     * IMPORTANT:
     * We use the exact order received from PayFast.
     */
    const expectedSignature =
      generateItnSignature(
        entries,
        passphrase,
      );

    const signaturesMatch =
      receivedSignature.toLowerCase() ===
      expectedSignature.toLowerCase();

    console.log(
      "PayFast signature comparison:",
      {
        received: receivedSignature,
        expected: expectedSignature,
        match: signaturesMatch,
      },
    );

    if (!signaturesMatch) {
      console.error(
        "Invalid PayFast signature.",
      );

      return new Response(
        "Invalid signature",
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    /*
     * Verify payment amount.
     */
    const expectedAmount =
      Number(order.total);

    const receivedAmount =
      Number(data.amount_gross ?? "");

    if (
      !Number.isFinite(expectedAmount) ||
      !Number.isFinite(receivedAmount)
    ) {
      console.error(
        "Invalid payment amount.",
      );

      return new Response(
        "Invalid amount",
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    if (
      Math.abs(
        receivedAmount - expectedAmount,
      ) > 0.01
    ) {
      console.error(
        "Amount mismatch:",
        {
          expected: expectedAmount,
          received: receivedAmount,
        },
      );

      return new Response(
        "Amount mismatch",
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    /*
     * PayFast server validation.
     *
     * PayFast expects the ITN variables as a normal
     * application/x-www-form-urlencoded POST.
     *
     * The signature itself is NOT sent in this validation
     * parameter string.
     */
    const validationBody =
      buildItnParameterString(entries);

    const validationUrl =
      mode === "test"
        ? PAYFAST_SANDBOX_VALIDATE_URL
        : PAYFAST_LIVE_VALIDATE_URL;

    console.log(
      "Sending ITN to PayFast validation endpoint:",
      validationUrl,
    );

    const validationResponse =
      await fetch(validationUrl, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: validationBody,
      });

    const validationText =
      (
        await validationResponse.text()
      ).trim();

    console.log(
      "PayFast validation response:",
      validationText,
    );

    if (
      !validationResponse.ok ||
      validationText !== "VALID"
    ) {
      console.error(
        "PayFast ITN validation failed:",
        {
          status: validationResponse.status,
          response: validationText,
        },
      );

      return new Response(
        "PayFast validation failed",
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    /*
     * All security checks passed:
     * 1. Order lookup
     * 2. Online payment check
     * 3. Merchant ID check
     * 4. Signature check
     * 5. Amount check
     * 6. PayFast server validation
     */
    const paymentStatus =
      data.payment_status ?? "";

    const payfastPaymentId =
      data.pf_payment_id ?? null;

    /*
     * Prevent duplicate processing.
     */
    if (order.payment_status === "paid") {
      console.log(
        "Order already marked as paid:",
        order.order_number,
      );

      return new Response("OK", {
        status: 200,
        headers: corsHeaders,
      });
    }

    /*
     * Successful payment.
     */
    if (paymentStatus === "COMPLETE") {
      const {
        error: updateError,
      } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "paid",
          payfast_payment_id:
            payfastPaymentId,
          payfast_event_id:
            payfastPaymentId,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateError) {
        console.error(
          "Failed to mark order as paid:",
          updateError,
        );

        return new Response(
          "Could not update order",
          {
            status: 500,
            headers: corsHeaders,
          },
        );
      }

      console.log(
        "Order successfully marked as paid:",
        order.order_number,
      );

      return new Response("OK", {
        status: 200,
        headers: corsHeaders,
      });
    }

    /*
     * Valid ITN but payment did not complete.
     */
    console.log(
      "PayFast payment not complete:",
      {
        orderNumber: order.order_number,
        paymentStatus,
      },
    );

    if (
      paymentStatus === "FAILED" ||
      paymentStatus === "CANCELLED"
    ) {
      const {
        error: updateError,
      } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "failed",
          payfast_payment_id:
            payfastPaymentId,
          payfast_event_id:
            payfastPaymentId,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateError) {
        console.error(
          "Failed to update failed payment:",
          updateError,
        );

        return new Response(
          "Could not update order",
          {
            status: 500,
            headers: corsHeaders,
          },
        );
      }
    }

    return new Response("OK", {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error(
      "PayFast ITN error:",
      error,
    );

    return new Response(
      "Internal server error",
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});
}