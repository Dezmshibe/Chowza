
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

type RegisterRequest = {
  orderNumber: number | string;
  customerPhone: string;
  token: string;
  platform: string;
};

function normalizeSouthAfricanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("0027")) return `27${digits.slice(4)}`;
  if (digits.startsWith("27")) return digits;
  if (digits.startsWith("0")) return `27${digits.slice(1)}`;

  return digits;
}

export default {
  fetch: withSupabase(
    { auth: ["publishable"] },
    async (req, ctx) => {
      try {
        if (req.method !== "POST") {
          return Response.json(
            { success: false, error: "Method not allowed." },
            { status: 405 },
          );
        }

        const body = (await req.json()) as RegisterRequest;

        const orderNumber = Number(body.orderNumber);
        const customerPhone = body.customerPhone?.trim();
        const token = body.token?.trim();
        const platform = body.platform?.toLowerCase();

        if (
          !Number.isInteger(orderNumber) ||
          orderNumber <= 0 ||
          !customerPhone ||
          !token ||
          !["android", "ios"].includes(platform)
        ) {
          return Response.json(
            { success: false, error: "Invalid subscription details." },
            { status: 400 },
          );
        }

        const normalizedPhone =
          normalizeSouthAfricanPhone(customerPhone);

        if (!/^27\d{9}$/.test(normalizedPhone)) {
          return Response.json(
            { success: false, error: "Invalid phone number." },
            { status: 400 },
          );
        }

        const { data: orders, error: lookupError } =
          await ctx.supabaseAdmin
            .from("orders")
            .select("id, customer_phone")
            .eq("order_number", orderNumber)
            .limit(1);

        if (lookupError) {
          console.error("Order lookup failed:", lookupError);

          return Response.json(
            { success: false, error: "Could not verify the order." },
            { status: 500 },
          );
        }

        const order = orders?.find(
          (candidate) =>
            normalizeSouthAfricanPhone(candidate.customer_phone) ===
            normalizedPhone,
        );

        if (!order) {
          return Response.json(
            { success: false, error: "Order verification failed." },
            { status: 404 },
          );
        }

        const { error: saveError } = await ctx.supabaseAdmin
          .from("customer_order_push_subscriptions")
          .upsert(
            {
              order_id: order.id,
              token,
              platform,
              is_active: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "order_id,token" },
          );

        if (saveError) {
          console.error("Subscription save failed:", saveError);

          return Response.json(
            { success: false, error: "Could not save notification subscription." },
            { status: 500 },
          );
        }

        return Response.json({ success: true });
      } catch (error) {
        console.error("Customer push registration error:", error);

        return Response.json(
          { success: false, error: "Something went wrong." },
          { status: 500 },
        );
      }
    },
  ),
};

