
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  getCorsHeaders,
  requireCsrf,
} from "../_shared/csrf.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

type CreateYocoCheckoutRequest = {
  orderNumber: number | string;
};

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
    const body = await req.json() as CreateYocoCheckoutRequest;
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
      .select(
        "id, business_id, order_number, total, payment_method, status",
      )
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (orderError) {
      console.error("Order lookup error:", orderError);
      return jsonResponse(
        { error: "Could not verify the order." },
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
        { error: "This order is not configured for online payment." },
        400,
        corsHeaders,
      );
    }

    if (order.status === "cancelled") {
      return jsonResponse(
        { error: "This order has been cancelled." },
        400,
        corsHeaders,
      );
    }

    const { data: yocoSecret, error: secretError } =
      await supabaseAdmin.rpc(
        "get_business_yoco_secret",
        { p_business_id: order.business_id },
      );

    if (secretError || !yocoSecret) {
      console.error("Yoco secret lookup failed:", secretError);
      return jsonResponse(
        { error: "Yoco payment is not enabled for this business." },
        400,
        corsHeaders,
      );
    }

    const siteUrl = (
      Deno.env.get("PUBLIC_SITE_URL") ||
      "https://chowza.onrender.com"
    ).replace(/\/+$/, "");

    const amountInCents = Math.round(Number(order.total) * 100);

    if (!Number.isInteger(amountInCents) || amountInCents <= 0) {
      return jsonResponse(
        { error: "Invalid order total." },
        400,
        corsHeaders,
      );
    }

    const response = await fetch(
      "https://payments.yoco.com/api/checkouts",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${yocoSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInCents,
          currency: "ZAR",
          metadata: {
            orderNumber: String(order.order_number),
            businessId: order.business_id,
            orderId: order.id,
          },
          successUrl:
            `${siteUrl}/payment/success?orderNumber=${order.order_number}`,
          failureUrl:
            `${siteUrl}/payment/failed?orderNumber=${order.order_number}`,
          cancelUrl:
            `${siteUrl}/payment/cancelled?orderNumber=${order.order_number}`,
          description: `Chowza Order #${order.order_number}`,
        }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Yoco checkout creation failed:", result);
      return jsonResponse(
        {
          error:
            result?.message ||
            "Could not create the Yoco checkout.",
        },
        response.status,
        corsHeaders,
      );
    }

    if (!result?.redirectUrl) {
      console.error("Yoco response missing redirectUrl:", result);
      return jsonResponse(
        { error: "Yoco did not return a payment URL." },
        502,
        corsHeaders,
      );
    }

    const { error: checkoutSaveError } = await supabaseAdmin
      .from("orders")
      .update({ yoco_checkout_id: result.id })
      .eq("id", order.id);

    if (checkoutSaveError) {
      console.error("Could not save Yoco checkout ID:", checkoutSaveError);
      return jsonResponse(
        {
          error:
            "Yoco checkout was created, but Chowza could not save the payment reference.",
        },
        500,
        corsHeaders,
      );
    }

    return jsonResponse(
      {
        success: true,
        checkoutId: result.id,
        redirectUrl: result.redirectUrl,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Create Yoco checkout error:", error);

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while creating the payment.",
      },
      500,
      corsHeaders,
    );
  }
});
