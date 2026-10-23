import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";

type CreateYocoCheckoutRequest = {
  orderNumber: number | string;
};

export default {
  fetch: withSupabase(
    { auth: ["publishable"] },
    async (req, ctx) => {
      try {
        if (req.method !== "POST") {
          return Response.json(
            { error: "Method not allowed." },
            { status: 405 },
          );
        }

        const body =
          (await req.json()) as CreateYocoCheckoutRequest;

        const orderNumber = Number(body.orderNumber);

        if (!Number.isInteger(orderNumber) || orderNumber <= 0) {
          return Response.json(
            { error: "Invalid order number." },
            { status: 400 },
          );
        }

        /*
         * Look up the real order in the database.
         *
         * We do NOT trust an amount supplied by the browser.
         */
        const { data: order, error: orderError } =
          await ctx.supabaseAdmin
            .from("orders")
            .select(
              "id, business_id, order_number, total, payment_method, status",
            )
            .eq("order_number", orderNumber)
            .maybeSingle();

        if (orderError) {
          console.error(
            "Order lookup error:",
            orderError,
          );

          return Response.json(
            { error: "Could not verify the order." },
            { status: 500 },
          );
        }

        if (!order) {
          return Response.json(
            { error: "Order not found." },
            { status: 404 },
          );
        }

        if (order.payment_method !== "online") {
          return Response.json(
            {
              error:
                "This order is not configured for online payment.",
            },
            { status: 400 },
          );
        }

        if (order.status === "cancelled") {
          return Response.json(
            { error: "This order has been cancelled." },
            { status: 400 },
          );
        }

        const businessId = order.business_id;

        /*
         * Retrieve this business's Yoco secret through the
         * protected database function.
         *
         * The actual Yoco secret never goes to the browser.
         */
        const { data: yocoSecret, error: secretError } =
          await ctx.supabaseAdmin.rpc(
            "get_business_yoco_secret",
            {
              p_business_id: businessId,
            },
          );

        if (secretError || !yocoSecret) {
          console.error(
            "Could not retrieve business Yoco secret:",
            secretError,
          );

          return Response.json(
            {
              error:
                "Yoco payment is not enabled for this business.",
            },
            { status: 400 },
          );
        }

        const siteUrl =
          Deno.env.get("PUBLIC_SITE_URL") ||
          "http://localhost:3000";

        const amountInCents = Math.round(
          Number(order.total) * 100,
        );

        if (!Number.isInteger(amountInCents) || amountInCents <= 0) {
          return Response.json(
            { error: "Invalid order total." },
            { status: 400 },
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
                businessId,
                orderId: order.id,
              },

              successUrl:
                `${siteUrl}/payment/success?orderNumber=${order.order_number}`,

              failureUrl:
                `${siteUrl}/payment/failed?orderNumber=${order.order_number}`,

              cancelUrl:
                `${siteUrl}/payment/cancelled?orderNumber=${order.order_number}`,

              description:
                `Chowza Order #${order.order_number}`,
            }),
          },
        );

        const result = await response.json();

        if (!response.ok) {
          console.error(
            "Yoco checkout creation failed:",
            result,
          );

          return Response.json(
            {
              error:
                result?.message ||
                "Could not create the Yoco checkout.",
            },
            { status: response.status },
          );
        }

        if (!result?.redirectUrl) {
          console.error(
            "Yoco response did not contain redirectUrl:",
            result,
          );

          return Response.json(
            {
              error:
                "Yoco did not return a payment URL.",
            },
            { status: 502 },
          );
        }

        return Response.json({
          success: true,
          checkoutId: result.id,
          redirectUrl: result.redirectUrl,
        });
      } catch (error) {
        console.error(
          "Create Yoco checkout error:",
          error,
        );

        return Response.json(
          {
            error:
              "Something went wrong while creating the payment.",
          },
          { status: 500 },
        );
      }
    },
  ),
};