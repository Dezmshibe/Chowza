import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

type CartItem = {
  itemId: string;
  quantity: number;
};

type OrderRequest = {
  businessId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  paymentMethod: "cash" | "eft" | "online";
  cart: CartItem[];
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

        const body = (await req.json()) as OrderRequest;

        if (
          !body.businessId ||
          !body.customerName?.trim() ||
          !body.customerPhone?.trim() ||
          !body.deliveryAddress?.trim() ||
          !body.paymentMethod ||
          !Array.isArray(body.cart) ||
          body.cart.length === 0
        ) {
          return Response.json(
            { error: "Missing required order information." },
            { status: 400 },
          );
        }

        const validPaymentMethods = ["cash", "eft", "online"];

        if (!validPaymentMethods.includes(body.paymentMethod)) {
          return Response.json(
            { error: "Invalid payment method." },
            { status: 400 },
          );
        }

        const cleanCart = body.cart.filter(
          (cartItem) =>
            typeof cartItem.itemId === "string" &&
            Number.isInteger(cartItem.quantity) &&
            cartItem.quantity > 0,
        );

        if (cleanCart.length === 0) {
          return Response.json(
            { error: "Your cart is empty." },
            { status: 400 },
          );
        }

        const { data: business, error: businessError } =
          await ctx.supabaseAdmin
            .from("businesses")
            .select("id, name, is_published")
            .eq("id", body.businessId)
            .eq("is_published", true)
            .maybeSingle();

        if (businessError) {
          console.error("Business lookup error:", businessError);

          return Response.json(
            { error: "Could not verify the business." },
            { status: 500 },
          );
        }

        if (!business) {
          return Response.json(
            { error: "This business is not available." },
            { status: 404 },
          );
        }

        const itemIds = [
          ...new Set(cleanCart.map((cartItem) => cartItem.itemId)),
        ];

        const { data: menuItems, error: menuError } =
          await ctx.supabaseAdmin
            .from("menu_items")
            .select("id, name, price, is_available")
            .eq("business_id", body.businessId)
            .in("id", itemIds);

        if (menuError) {
          console.error("Menu lookup error:", menuError);

          return Response.json(
            { error: "Could not verify the menu items." },
            { status: 500 },
          );
        }

        if (!menuItems || menuItems.length !== itemIds.length) {
          return Response.json(
            { error: "One or more items are no longer available." },
            { status: 400 },
          );
        }

        const unavailableItem = menuItems.find(
          (menuItem) => !menuItem.is_available,
        );

        if (unavailableItem) {
          return Response.json(
            {
              error: `${unavailableItem.name} is currently unavailable.`,
            },
            { status: 400 },
          );
        }

        let total = 0;

        const orderItems = cleanCart.map((cartItem) => {
          const menuItem = menuItems.find(
            (item) => item.id === cartItem.itemId,
          );

          if (!menuItem) {
            throw new Error("Menu item verification failed.");
          }

          const price = Number(menuItem.price);
          const quantity = cartItem.quantity;
          const lineTotal = price * quantity;

          total += lineTotal;

          return {
            id: menuItem.id,
            name: menuItem.name,
            price,
            quantity,
            line_total: lineTotal,
          };
        });

        total = Number(total.toFixed(2));

        const { data: order, error: orderError } =
          await ctx.supabaseAdmin
            .from("orders")
            .insert({
              business_id: business.id,
              customer_name: body.customerName.trim(),
              customer_phone: body.customerPhone.trim(),
              delivery_address: body.deliveryAddress.trim(),
              items: orderItems,
              total,
              status: "pending",
              payment_method: body.paymentMethod,
            })
            .select("id, order_number, total, status, payment_method")
            .single();

        if (orderError) {
          console.error("Order creation error:", orderError);

          return Response.json(
            { error: "Could not create your order." },
            { status: 500 },
          );
        }

        return Response.json({
          success: true,
          businessName: business.name,
          order: {
            id: order.id,
            orderNumber: order.order_number,
            total: order.total,
            status: order.status,
            paymentMethod: order.payment_method,
          },
        });
      } catch (error) {
        console.error("Create order error:", error);

        return Response.json(
          { error: "Something went wrong while creating your order." },
          { status: 500 },
        );
      }
    },
  ),
};