
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { getCorsHeaders, requireCsrf } from "../_shared/csrf.ts";

type CartItem = {
  itemId: string;
  quantity: number;
};

type OrderRequest = {
  businessId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  customerNote?: string;
  promoCode?: string;
  paymentMethod: "cash" | "online";
  fulfillmentType?: "delivery" | "pickup";
  cart: CartItem[];
};

export default {
  fetch: withSupabase(
    {
      auth: ["publishable"],
      cors: {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type, x-csrf-token",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        },
      },
    },
    async (req, ctx) => {
      const corsHeaders = getCorsHeaders(req);

      try {
        if (req.method === "OPTIONS") {
          return new Response("ok", {
            status: 200,
            headers: corsHeaders,
          });
        }

        const csrfError = await requireCsrf(req);

        if (csrfError) {
          return csrfError;
        }

        if (req.method !== "POST") {
          return Response.json(
            { error: "Method not allowed." },
            { status: 405, headers: corsHeaders },
          );
        }

        const body = (await req.json()) as OrderRequest;
        const fulfillmentType = body.fulfillmentType || "delivery";

        if (
          !body.businessId ||
          !body.customerName?.trim() ||
          !body.customerPhone?.trim() ||
          !body.paymentMethod ||
          !Array.isArray(body.cart) ||
          body.cart.length === 0
        ) {
          return Response.json(
            { error: "Missing required order information." },
            { status: 400, headers: corsHeaders },
          );
        }

        if (body.cart.length > 100) {
          return Response.json(
            { error: "Too many items in your cart." },
            { status: 400, headers: corsHeaders },
          );
        }

        if (
          fulfillmentType !== "delivery" &&
          fulfillmentType !== "pickup"
        ) {
          return Response.json(
            { error: "Invalid fulfillment type." },
            { status: 400, headers: corsHeaders },
          );
        }

        if (
          fulfillmentType === "delivery" &&
          !body.deliveryAddress?.trim()
        ) {
          return Response.json(
            {
              error: "Delivery address is required for delivery orders.",
            },
            { status: 400, headers: corsHeaders },
          );
        }

        if (
          !["cash", "online"].includes(body.paymentMethod)
        ) {
          return Response.json(
            { error: "Invalid payment method." },
            { status: 400, headers: corsHeaders },
          );
        }

        const cleanCart = body.cart.filter(
          (item) =>
            typeof item.itemId === "string" &&
            item.itemId.length > 0 &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0 &&
            item.quantity <= 100,
        );

        if (
          cleanCart.length === 0 ||
          cleanCart.length !== body.cart.length
        ) {
          return Response.json(
            { error: "Your cart contains invalid items or quantities." },
            { status: 400, headers: corsHeaders },
          );
        }

        const customerName = body.customerName.trim();
        const customerPhone = body.customerPhone.trim();
        const deliveryAddress = body.deliveryAddress?.trim() || "";
        const customerNote = body.customerNote?.trim() || "";

        if (
          customerName.length > 150 ||
          customerPhone.length > 40 ||
          deliveryAddress.length > 500 ||
          customerNote.length > 1000
        ) {
          return Response.json(
            { error: "One or more order details are too long." },
            { status: 400, headers: corsHeaders },
          );
        }

        // Verify the published business and its configured delivery fee.
        const { data: business, error: businessError } =
          await ctx.supabaseAdmin
            .from("businesses")
            .select("id, name, is_published, delivery_fee")
            .eq("id", body.businessId)
            .eq("is_published", true)
            .maybeSingle();

        if (businessError) {
          console.error("Business lookup error:", businessError);

          return Response.json(
            { error: "Could not verify the business." },
            { status: 500, headers: corsHeaders },
          );
        }

        if (!business) {
          return Response.json(
            { error: "This business is not available." },
            { status: 404, headers: corsHeaders },
          );
        }

        // Verify all menu items against this business.
        const itemIds = [
          ...new Set(cleanCart.map((item) => item.itemId)),
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
            { status: 500, headers: corsHeaders },
          );
        }

        if (!menuItems || menuItems.length !== itemIds.length) {
          return Response.json(
            { error: "One or more items are no longer available." },
            { status: 400, headers: corsHeaders },
          );
        }

        const unavailableItem = menuItems.find(
          (item) => !item.is_available,
        );

        if (unavailableItem) {
          return Response.json(
            {
              error: `${unavailableItem.name} is currently unavailable.`,
            },
            { status: 400, headers: corsHeaders },
          );
        }

        // Calculate subtotal using verified database prices.
        let subtotal = 0;

        const orderItems = cleanCart.map((cartItem) => {
          const menuItem = menuItems.find(
            (item) => item.id === cartItem.itemId,
          );

          if (!menuItem) {
            throw new Error("Menu item verification failed.");
          }

          const price = Number(menuItem.price);
          const quantity = cartItem.quantity;

          if (!Number.isFinite(price) || price < 0) {
            throw new Error("Invalid menu item price.");
          }

          const lineTotal = Number(
            (price * quantity).toFixed(2),
          );

          subtotal += lineTotal;

          return {
            id: menuItem.id,
            name: menuItem.name,
            price,
            quantity,
            line_total: lineTotal,
          };
        });

        subtotal = Number(subtotal.toFixed(2));

        // Delivery fee is retrieved from the business record.
        const configuredDeliveryFee = Number(
          business.delivery_fee ?? 25,
        );

        if (
          !Number.isFinite(configuredDeliveryFee) ||
          configuredDeliveryFee < 0
        ) {
          console.error("Invalid business delivery fee.");

          return Response.json(
            { error: "This business has an invalid delivery fee." },
            { status: 500, headers: corsHeaders },
          );
        }

        const deliveryFee = Number(
          (
            fulfillmentType === "delivery"
              ? configuredDeliveryFee
              : 0
          ).toFixed(2),
        );

        // Validate a promotion against this business only.
        let discountAmount = 0;
        let appliedPromoCode: string | null = null;

        const submittedPromoCode = body.promoCode?.trim() || "";

        if (submittedPromoCode) {
          const normalizedCode = submittedPromoCode.toUpperCase();

          if (!/^[A-Z0-9_-]{2,30}$/.test(normalizedCode)) {
            return Response.json(
              { error: "Invalid promotion code format." },
              { status: 400, headers: corsHeaders },
            );
          }

          const { data: promotion, error: promotionError } =
            await ctx.supabaseAdmin
              .from("promotions")
              .select(
  "id, business_id, code, discount_type, discount_value, minimum_order, customer_message, is_active",
)
              .eq("business_id", business.id)
              .ilike("code", normalizedCode)
              .maybeSingle();

          if (promotionError) {
            console.error("Promotion lookup error:", promotionError);

            return Response.json(
              { error: "Could not verify the promotion code." },
              { status: 500, headers: corsHeaders },
            );
          }

          if (!promotion || !promotion.is_active) {
            return Response.json(
              { error: "This promotion code is invalid or inactive." },
              { status: 400, headers: corsHeaders },
            );
          }

          const now = Date.now();

          
          if (
            promotion.expires_at &&
            new Date(promotion.expires_at).getTime() <= now
          ) {
            return Response.json(
              { error: "This promotion has expired." },
              { status: 400, headers: corsHeaders },
            );
          }

          const minimumOrderAmount = Number(
  promotion.minimum_order ?? 0,
);

          if (subtotal < minimumOrderAmount) {
            return Response.json(
              {
                error:
                  `This promotion requires a minimum order of R${minimumOrderAmount.toFixed(2)}.`,
              },
              { status: 400, headers: corsHeaders },
            );
          }

          const discountValue = Number(promotion.discount_value);

          if (
            !Number.isFinite(discountValue) ||
            discountValue <= 0
          ) {
            return Response.json(
              { error: "This promotion has an invalid discount." },
              { status: 400, headers: corsHeaders },
            );
          }

          if (promotion.discount_type === "percentage") {
            if (discountValue > 100) {
              return Response.json(
                { error: "This promotion has an invalid discount." },
                { status: 400, headers: corsHeaders },
              );
            }

            discountAmount = Number(
              (subtotal * discountValue / 100).toFixed(2),
            );
          } else if (promotion.discount_type === "fixed") {
            discountAmount = discountValue;
          } else {
            return Response.json(
              { error: "This promotion has an unsupported discount type." },
              { status: 400, headers: corsHeaders },
            );
          }

          // Never allow a discount greater than the item subtotal.
          discountAmount = Number(
            Math.min(discountAmount, subtotal).toFixed(2),
          );

          appliedPromoCode = promotion.code;
        }

        const total = Number(
          (subtotal - discountAmount + deliveryFee).toFixed(2),
        );

        if (!Number.isFinite(total) || total <= 0) {
          return Response.json(
            { error: "The calculated order total is invalid." },
            { status: 400, headers: corsHeaders },
          );
        }

        // Save the complete order and its calculated totals.
        const { data: order, error: orderError } =
          await ctx.supabaseAdmin
            .from("orders")
            .insert({
              business_id: business.id,
              customer_name: customerName,
              customer_phone: customerPhone,
              delivery_address:
                fulfillmentType === "delivery"
                  ? deliveryAddress
                  : "Pickup / Collection",
              customer_note: customerNote || null,
              fulfillment_type: fulfillmentType,
              items: orderItems,
              subtotal,
              discount_amount: discountAmount,
              delivery_fee: deliveryFee,
              promo_code: appliedPromoCode,
              total,
              status: "pending",
              payment_method: body.paymentMethod,
            })
            .select(
              "id, order_number, total, status, payment_method",
            )
            .single();

        if (orderError) {
          console.error("Order creation error:", orderError);

          return Response.json(
            { error: "Could not create your order." },
            { status: 500, headers: corsHeaders },
          );
        }

        return Response.json(
          {
            success: true,
            businessName: business.name,
            fulfillmentType,
            subtotal,
            discountAmount,
            promoCode: appliedPromoCode,
            deliveryFee,
            total,
            order: {
              id: order.id,
              orderNumber: order.order_number,
              total: order.total,
              status: order.status,
              paymentMethod: order.payment_method,
            },
          },
          { headers: corsHeaders },
        );
      } catch (error) {
        console.error("Create order error:", error);

        return Response.json(
          {
            error:
              "Something went wrong while creating your order.",
          },
          { status: 500, headers: corsHeaders },
        );
      }
    },
  ),
};
