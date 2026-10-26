import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createHash } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PayFastData = Record<string, string>;

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ?? "";

const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

/*
 * PayFast uses application/x-www-form-urlencoded-style
 * encoding for signature generation:
 *
 * - spaces become +
 * - percent encoding is uppercase
 * - values are trimmed before encoding
 */
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

/*
 * Build the exact parameter string used for the
 * PayFast ITN signature.
 *
 * IMPORTANT:
 * We preserve the order in which PayFast actually
 * sent the fields.
 *
 * PayFast's own ITN example builds the string from
 * the received POST variables and stops at signature.
 */
function buildSignatureString(
  entries: Array<[string, string]>,
  passphrase: string,
): string {
  const parts: string[] = [];

  for (const [key, rawValue] of entries) {
    if (key === "signature") {
      break;
    }

    const value = rawValue.trim();

    if (value === "") {
      continue;
    }

    parts.push(
      `${key}=${payfastUrlEncode(value)}`,
    );
  }

  parts.push(
    `passphrase=${payfastUrlEncode(passphrase)}`,
  );

  return parts.join("&");
}

function generateSignature(
  entries: Array<[string, string]>,
  passphrase: string,
): string {
  const parameterString =
    buildSignatureString(
      entries,
      passphrase,
    );

  return createHash("md5")
    .update(parameterString)
    .digest("hex");
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json",
      },
    },
  );
}

function getPayFastValidationUrl(
  mode: string,
): string {
  return mode === "live"
    ? "https://www.payfast.co.za/eng/query/validate"
    : "https://sandbox.payfast.co.za/eng/query/validate";
}

async function parsePayFastRequest(
  req: Request,
): Promise<{
  entries: Array<[string, string]>;
  data: PayFastData;
}> {
  const contentType =
    req.headers.get("content-type") ?? "";

  console.log(
    "ITN CONTENT-TYPE:",
    contentType,
  );

  const entries: Array<[string, string]> =
    [];

  /*
   * PayFast normally sends:
   *
   * application/x-www-form-urlencoded
   *
   * but support multipart/form-data too.
   */
  if (
    contentType.includes(
      "multipart/form-data",
    )
  ) {
    const form = await req.formData();

    for (const [
      key,
      value,
    ] of form.entries()) {
      if (typeof value === "string") {
        entries.push([key, value]);
      }
    }
  } else {
    const rawBody = await req.text();

    const params =
      new URLSearchParams(rawBody);

    for (const [
      key,
      value,
    ] of params.entries()) {
      entries.push([key, value]);
    }
  }

  const data: PayFastData = {};

  for (const [
    key,
    value,
  ] of entries) {
    data[key] = value;
  }

  return {
    entries,
    data,
  };
}

Deno.serve(async (req: Request) => {
  try {
    /*
     * CORS preflight.
     */
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return jsonResponse(
        {
          error:
            "Method not allowed.",
        },
        405,
      );
    }

    /*
     * Parse the PayFast ITN.
     */
    const {
      entries,
      data,
    } =
      await parsePayFastRequest(req);

    console.log(
      "ITN FIELDS RECEIVED:",
      entries.map(([key]) => key),
    );

    if (entries.length === 0) {
      console.error(
        "PayFast ITN contained no fields.",
      );

      return new Response(
        "No ITN data received.",
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    console.log(
      "ITN merchant_id:",
      data.merchant_id ?? "",
    );

    console.log(
      "ITN amount_gross:",
      data.amount_gross ?? "",
    );

    console.log(
      "ITN pf_payment_id:",
      data.pf_payment_id ?? "",
    );

    console.log(
      "ITN m_payment_id:",
      data.m_payment_id ?? "",
    );

    console.log(
      "ITN payment_status:",
      data.payment_status ?? "",
    );

    /*
     * Required fields.
     */
    const merchantId =
      data.merchant_id ?? "";

    const mPaymentId =
      data.m_payment_id ?? "";

    const pfPaymentId =
      data.pf_payment_id ?? "";

    const receivedSignature =
      data.signature ?? "";

    if (
      !merchantId ||
      !mPaymentId ||
      !receivedSignature
    ) {
      console.error(
        "PayFast ITN missing required fields.",
      );

      return new Response(
        "Missing required ITN fields.",
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    /*
     * The m_payment_id is our Chowza order UUID.
     */
    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .select(
        "id, business_id, order_number, total, payment_method, payment_status, status",
      )
      .eq("id", mPaymentId)
      .maybeSingle();

    if (orderError) {
      console.error(
        "Order lookup failed:",
        orderError,
      );

      return new Response(
        "Order lookup failed.",
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }

    if (!order) {
      console.error(
        "Order not found for m_payment_id:",
        mPaymentId,
      );

      return new Response(
        "Order not found.",
        {
          status: 404,
          headers: corsHeaders,
        },
      );
    }

    /*
     * Retrieve this business's PayFast credentials.
     */
    const {
      data: config,
      error: configError,
    } =
      await supabaseAdmin.rpc(
        "get_business_payfast_config",
        {
          p_business_id:
            order.business_id,
        },
      );

    if (
      configError ||
      !config
    ) {
      console.error(
        "PayFast config lookup failed:",
        configError,
      );

      return new Response(
        "PayFast configuration unavailable.",
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }

    const configRow =
      Array.isArray(config)
        ? config[0]
        : config;

    if (!configRow) {
      console.error(
        "PayFast configuration row missing.",
      );

      return new Response(
        "PayFast configuration unavailable.",
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }

    const configuredMerchantId =
      String(
        configRow.merchant_id ?? "",
      );

    const passphrase =
      String(
        configRow.passphrase ?? "",
      );

    const mode =
      configRow.mode === "live"
        ? "live"
        : "test";

    /*
     * Verify Merchant ID.
     */
    if (
      merchantId !==
      configuredMerchantId
    ) {
      console.error(
        "PayFast merchant ID mismatch.",
        {
          received: merchantId,
          expected:
            configuredMerchantId,
        },
      );

      return new Response(
        "Invalid merchant ID.",
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    /*
     * Generate our expected ITN signature.
     */
    const expectedSignature =
      generateSignature(
        entries,
        passphrase,
      );

    console.log(
      "PayFast signature comparison:",
      {
        received:
          receivedSignature,
        expected:
          expectedSignature,
        match:
          receivedSignature ===
          expectedSignature,
      },
    );

    /*
     * Log the exact string used for the
     * signature, but NEVER log the passphrase.
     */
    const signatureString =
      buildSignatureString(
        entries,
        passphrase,
      );

    console.log(
      "PayFast ITN signature string:",
      signatureString,
    );

    /*
     * Signature must match before anything
     * is marked as paid.
     */
    if (
      receivedSignature !==
      expectedSignature
    ) {
      console.error(
        "Invalid PayFast signature.",
      );

      return new Response(
        "Invalid PayFast signature.",
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    /*
     * Verify the amount against our database.
     */
    const receivedAmount =
      Number(
        data.amount_gross ?? "",
      );

    const expectedAmount =
      Number(order.total);

    if (
      !Number.isFinite(
        receivedAmount,
      ) ||
      !Number.isFinite(
        expectedAmount,
      )
    ) {
      console.error(
        "Invalid payment amount.",
        {
          receivedAmount,
          expectedAmount,
        },
      );

      return new Response(
        "Invalid payment amount.",
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    if (
      receivedAmount.toFixed(2) !==
      expectedAmount.toFixed(2)
    ) {
      console.error(
        "PayFast amount mismatch.",
        {
          received:
            receivedAmount.toFixed(2),
          expected:
            expectedAmount.toFixed(2),
        },
      );

      return new Response(
        "Amount mismatch.",
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    /*
     * Verify the ITN with PayFast's
     * official validation endpoint.
     */
    const validationUrl =
      getPayFastValidationUrl(mode);

    const validationBody =
      entries
        .map(
          ([key, value]) =>
            `${payfastUrlEncode(key)}=${payfastUrlEncode(value)}`,
        )
        .join("&");

    console.log(
      "Sending ITN validation to PayFast:",
      validationUrl,
    );

    const validationResponse =
      await fetch(
        validationUrl,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body: validationBody,
        },
      );

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
        "PayFast ITN validation failed.",
        {
          httpStatus:
            validationResponse.status,
          response:
            validationText,
        },
      );

      return new Response(
        "PayFast validation failed.",
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    /*
     * Payment status from PayFast.
     */
    const paymentStatus =
      String(
        data.payment_status ?? "",
      ).toUpperCase();

    console.log(
      "Processing PayFast payment status:",
      paymentStatus,
    );

    /*
     * COMPLETE = payment successfully completed.
     */
    if (
      paymentStatus === "COMPLETE"
    ) {
      const {
        error: updateError,
      } =
        await supabaseAdmin
          .from("orders")
          .update({
            payment_status: "paid",
            payfast_payment_id:
              pfPaymentId || null,
            payfast_event_id:
              pfPaymentId || null,
          })
          .eq("id", order.id);

      if (updateError) {
        console.error(
          "Failed to mark order as paid:",
          updateError,
        );

        return new Response(
          "Could not update order.",
          {
            status: 500,
            headers: corsHeaders,
          },
        );
      }

      console.log(
        "Order successfully marked as paid:",
        order.id,
      );

      return new Response(
        "OK",
        {
          status: 200,
          headers: corsHeaders,
        },
      );
    }

    /*
     * FAILED / CANCELLED.
     */
    if (
      paymentStatus === "FAILED" ||
      paymentStatus === "CANCELLED"
    ) {
      const {
        error: updateError,
      } =
        await supabaseAdmin
          .from("orders")
          .update({
            payment_status: "failed",
            payfast_payment_id:
              pfPaymentId || null,
            payfast_event_id:
              pfPaymentId || null,
          })
          .eq("id", order.id);

      if (updateError) {
        console.error(
          "Failed to update failed payment:",
          updateError,
        );

        return new Response(
          "Could not update order.",
          {
            status: 500,
            headers: corsHeaders,
          },
        );
      }

      console.log(
        "Order marked as failed:",
        order.id,
      );

      return new Response(
        "OK",
        {
          status: 200,
          headers: corsHeaders,
        },
      );
    }

    /*
     * Unknown/unexpected PayFast status.
     */
    console.warn(
      "Unhandled PayFast payment status:",
      paymentStatus,
    );

    return new Response(
      "OK",
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error(
      "PayFast ITN error:",
      error,
    );

    return new Response(
      "Internal server error.",
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});