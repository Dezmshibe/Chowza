import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

const ALLOWED_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "completed",
  "cancelled",
];

const PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "";
const SERVICE_ACCOUNT_JSON =
  Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON") ?? "";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function base64url(data: Uint8Array | string): string {
  const bytes = typeof data === "string"
    ? new TextEncoder().encode(data)
    : data;

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function pemToBytes(pem: string): Uint8Array {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  return Uint8Array.from(
    atob(base64),
    (character) => character.charCodeAt(0),
  );
}

async function getFirebaseAccessToken(): Promise<string> {
  const account = JSON.parse(SERVICE_ACCOUNT_JSON);

  if (
    account.project_id !== PROJECT_ID ||
    !account.client_email ||
    !account.private_key
  ) {
    throw new Error("Firebase service account configuration is invalid.");
  }

  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({
    alg: "RS256",
    typ: "JWT",
  }));

  const claim = base64url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));

  const unsignedToken = `${header}.${claim}`;

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToBytes(account.private_key).buffer as ArrayBuffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(unsignedToken),
  );

  const assertion =
    `${unsignedToken}.${base64url(new Uint8Array(signature))}`;

  const response = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.access_token) {
    console.error("Firebase authentication failed.");
    throw new Error("Firebase authentication failed.");
  }

  return result.access_token;
}

function notificationForStatus(status: OrderStatus, orderNumber: number) {
  const messages: Record<OrderStatus, { title: string; body: string }> = {
    pending: {
      title: "Order update",
      body: `Your order #${orderNumber} is pending.`,
    },
    confirmed: {
      title: "Order accepted!",
      body: `Good news! Your order #${orderNumber} has been accepted.`,
    },
    preparing: {
      title: "Your order is being prepared",
      body: `The business is preparing your order #${orderNumber}.`,
    },
    out_for_delivery: {
      title: "Your order is on its way!",
      body: `Your order #${orderNumber} is out for delivery.`,
    },
    completed: {
      title: "Order completed",
      body: `Your order #${orderNumber} has been completed. Thank you for choosing Chowza!`,
    },
    cancelled: {
      title: "Order cancelled",
      body: `Your order #${orderNumber} has been cancelled. Please contact the business if you need assistance.`,
    },
  };

  return messages[status];
}

export default {
  fetch: withSupabase(
    { auth: "user" },
    async (req, ctx) => {
      try {
        if (req.method !== "POST") {
          return json({ error: "Method not allowed." }, 405);
        }

        const userId = ctx.userClaims?.id;

        if (!userId) {
          return json({ error: "Authentication required." }, 401);
        }

        const body = await req.json();
        const orderId = body?.orderId;
        const status = body?.status;

        if (
          typeof orderId !== "string" ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)
        ) {
          return json({ error: "A valid orderId is required." }, 400);
        }

        if (
          typeof status !== "string" ||
          !ALLOWED_STATUSES.includes(status as OrderStatus)
        ) {
          return json({ error: "Invalid order status." }, 400);
        }

        const newStatus = status as OrderStatus;
        
const supabase = ctx.supabaseAdmin;

// Check the trusted administrator role from verified JWT claims.
const isAdmin = ctx.userClaims?.appMetadata?.role === "admin";

// Only retrieve business ownership for non-admin users.
let ownedBusinessIds: string[] = [];

if (!isAdmin) {
  const { data: businesses, error: businessError } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .limit(100);

  if (businessError) {
    console.error("Business ownership lookup failed.");
    return json({ error: "Could not verify business access." }, 500);
  }

  ownedBusinessIds = (businesses ?? []).map((business) => business.id);
}


        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select("id, business_id, order_number, status")
          .eq("id", orderId)
          .maybeSingle();

        if (orderError) {
          console.error("Order lookup failed.");
          return json({ error: "Could not retrieve order." }, 500);
        }

        if (!order) {
          return json({ error: "Order not found." }, 404);
        }

const ownsBusiness = ownedBusinessIds.includes(order.business_id);

if (!isAdmin && !ownsBusiness) {
  return json(
    { error: "You are not authorized to update this order." },
    403,
  );
}


        if (order.status === newStatus) {
          return json({
            success: true,
            status: newStatus,
            notificationSent: 0,
            message: "Order already has this status.",
          });
        }

        // Update the order only after ownership has been verified.
        const { data: updatedOrder, error: updateError } = await supabase
          .from("orders")
          .update({
  status: newStatus,
  updated_at: new Date().toISOString(),
})
          .eq("id", orderId)
          .eq("business_id", order.business_id)
          .select("id, status")
          .maybeSingle();

        if (updateError || !updatedOrder) {
          console.error("Order status update failed.");
          return json({ error: "Could not update order status." }, 500);
        }

        // Find active Customer subscriptions for this order.
        const { data: devices, error: deviceError } = await supabase
          .from("customer_order_push_subscriptions")
          .select("id, token")
          .eq("order_id", orderId)
          .eq("is_active", true);

        if (deviceError) {
          console.error("Customer subscription lookup failed.");
          return json({
            success: true,
            status: newStatus,
            notificationSent: 0,
            notificationError: "Could not retrieve customer devices.",
          });
        }

        if (!devices?.length) {
          return json({
            success: true,
            status: newStatus,
            notificationSent: 0,
            message: "Order updated. No active customer devices found.",
          });
        }

        if (!PROJECT_ID || !SERVICE_ACCOUNT_JSON) {
          console.error("Firebase configuration is incomplete.");
          return json({
            success: true,
            status: newStatus,
            notificationSent: 0,
            notificationError: "Push notification configuration is incomplete.",
          });
        }

        // Notification failure must never undo the saved order status.
        let accessToken: string;

        try {
          accessToken = await getFirebaseAccessToken();
        } catch {
          return json({
            success: true,
            status: newStatus,
            notificationSent: 0,
            notificationError: "Could not authenticate with Firebase.",
          });
        }

        const notification = notificationForStatus(
          newStatus,
          Number(order.order_number),
        );

        let sent = 0;
        let failed = 0;
        const invalidTokenIds: string[] = [];

        for (const device of devices) {
          try {
            const response = await fetch(
              `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  message: {
                    token: device.token,
                    notification,
                    data: {
                      type: "order_status_update",
                      orderId: order.id,
                      orderNumber: String(order.order_number),
                      status: newStatus,
                    },
                    android: {
                      priority: "HIGH",
                      notification: {
                        channel_id: "orders",
                        sound: "default",
                      },
                    },
                  },
                }),
              },
            );

            if (response.ok) {
              sent++;
              continue;
            }

            failed++;

            const errorBody = await response.json().catch(() => ({}));
            const errorCode = errorBody?.error?.details?.find(
              (item: { errorCode?: string }) => item.errorCode,
            )?.errorCode;

            if (errorCode === "UNREGISTERED") {
              invalidTokenIds.push(device.id);
            }

            console.error("Customer FCM delivery failed:", {
              deviceId: device.id,
              status: response.status,
              errorCode,
            });
          } catch (deliveryError) {
            failed++;
            console.error("Customer notification delivery failed:", deliveryError);
          }
        }

        if (invalidTokenIds.length) {
          const { error: deactivateError } = await supabase
            .from("customer_order_push_subscriptions")
            .update({
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .in("id", invalidTokenIds);

          if (deactivateError) {
            console.error("Could not deactivate expired customer tokens.");
          }
        }

        return json({
          success: true,
          status: newStatus,
          notificationSent: sent,
          notificationFailed: failed,
          totalDevices: devices.length,
          invalidTokens: invalidTokenIds.length,
        });
      } catch (error) {
        console.error("Update order status error:", error);
        return json({ error: "Something went wrong." }, 500);
      }
    },
  ),
};

