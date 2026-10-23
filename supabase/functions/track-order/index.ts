import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

type TrackOrderRequest = {
  orderNumber: number | string;
  customerPhone: string;
};

function normalizeSouthAfricanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("0027")) {
    return `27${digits.slice(4)}`;
  }

  if (digits.startsWith("27")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `27${digits.slice(1)}`;
  }

  return digits;
}

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

        const body = (await req.json()) as TrackOrderRequest;

        const orderNumber = Number(body.orderNumber);
        const customerPhone = body.customerPhone?.trim();

        if (
          !Number.isInteger(orderNumber) ||
          orderNumber <= 0 ||
          !customerPhone
        ) {
          return Response.json(
            {
              error:
                "Please provide a valid order number and phone number.",
            },
            { status: 400 },
          );
        }

        const normalizedCustomerPhone =
          normalizeSouthAfricanPhone(customerPhone);

        if (
          !/^27\d{9}$/.test(normalizedCustomerPhone)
        ) {
          return Response.json(
            {
              error:
                "Please enter a valid South African phone number.",
            },
            { status: 400 },
          );
        }

        const { data: orders, error: orderError } =
          await ctx.supabaseAdmin
            .from("orders")
            .select(
              `
                order_number,
                customer_name,
                customer_phone,
                items,
                total,
                status,
                payment_method,
                created_at,
                updated_at
              `,
            )
            .eq("order_number", orderNumber)
            .limit(1);

        if (orderError) {
          console.error("Order tracking lookup error:", orderError);

          return Response.json(
            { error: "Could not look up your order." },
            { status: 500 },
          );
        }

        const order = orders?.find(
          (candidate) =>
            normalizeSouthAfricanPhone(candidate.customer_phone) ===
            normalizedCustomerPhone,
        );

        if (!order) {
          return Response.json(
            {
              error:
                "No matching order was found. Please check your order number and phone number.",
            },
            { status: 404 },
          );
        }

        return Response.json({
          success: true,
          order: {
            orderNumber: order.order_number,
            customerName: order.customer_name,
            items: order.items,
            total: order.total,
            status: order.status,
            paymentMethod: order.payment_method,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
          },
        });
      } catch (error) {
        console.error("Track order error:", error);

        return Response.json(
          {
            error:
              "Something went wrong while tracking your order.",
          },
          { status: 500 },
        );
      }
    },
  ),
};