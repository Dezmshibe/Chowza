
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "";
const SERVICE_ACCOUNT_JSON =
  Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON") ?? "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const PUSH_FUNCTION_SECRET =
  Deno.env.get("PUSH_FUNCTION_SECRET") ?? "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-push-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

// Constant-time comparison for the internal notification secret.
function secureCompare(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const x = encoder.encode(a);
  const y = encoder.encode(b);

  if (x.length !== y.length) return false;

  let difference = 0;

  for (let i = 0; i < x.length; i++) {
    difference |= x[i] ^ y[i];
  }

  return difference === 0;
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
    pemToBytes(account.private_key),
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
    console.error("Firebase authentication error:", result);
    throw new Error("Firebase authentication failed.");
  }

  return result.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: CORS_HEADERS,
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }


const missingConfig = [
  ["FIREBASE_PROJECT_ID", PROJECT_ID],
  ["FIREBASE_SERVICE_ACCOUNT_JSON", SERVICE_ACCOUNT_JSON],
  ["SUPABASE_URL", SUPABASE_URL],
  ["SUPABASE_SERVICE_ROLE_KEY", SERVICE_ROLE_KEY],
  ["PUSH_FUNCTION_SECRET", PUSH_FUNCTION_SECRET],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingConfig.length > 0) {
  console.error("Missing configuration:", missingConfig);

  return json({
    error: "Server configuration is incomplete.",
    missing: missingConfig,
  }, 500);
}


  // Supabase gateway JWT verification remains enabled.
  // This additional secret authorizes the internal notification caller.
  const suppliedSecret = req.headers.get("x-push-secret") ?? "";

  if (!secureCompare(suppliedSecret, PUSH_FUNCTION_SECRET)) {
    return json({ error: "Unauthorized." }, 401);
  }

  try {
    const body = await req.json();
    const orderId = body?.orderId;

    if (
      typeof orderId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)
    ) {
      return json({ error: "A valid orderId is required." }, 400);
    }

    const supabase = createClient(
      SUPABASE_URL,
      SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    // Retrieve the order.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, business_id, order_number, customer_name, total, status",
      )
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      console.error("Order lookup failed:", orderError.message);
      return json({ error: "Could not retrieve order." }, 500);
    }

    if (!order) {
      return json({ error: "Order not found." }, 404);
    }

    // Retrieve active business devices.
    const { data: tokens, error: tokenError } = await supabase
      .from("business_push_tokens")
      .select("id, token")
      .eq("business_id", order.business_id)
      .eq("app_target", "business")
      .eq("is_active", true);

    if (tokenError) {
      console.error("Device lookup failed:", tokenError.message);
      return json({ error: "Could not retrieve device tokens." }, 500);
    }

    if (!tokens?.length) {
      return json({
        success: true,
        sent: 0,
        totalDevices: 0,
        message: "No registered business devices.",
      });
    }

    // Authenticate with Firebase.
    const accessToken = await getFirebaseAccessToken();

    let sent = 0;
    let failed = 0;

    const invalidTokenIds: string[] = [];

    // Send notification to each registered device.
    for (const device of tokens) {
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

                notification: {
                  title: "New Chowza order",
                  body: `Order #${order.order_number} received from ${order.customer_name}.`,
                },

                data: {
                  type: "new_order",
                  orderId: order.id,
                  orderNumber: String(order.order_number),
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

        console.error("FCM delivery failed:", {
          deviceId: device.id,
          status: response.status,
          errorCode,
        });

        // Only deactivate tokens Firebase confirms are unregistered.
        if (errorCode === "UNREGISTERED") {
          invalidTokenIds.push(device.id);
        }
      } catch (deliveryError) {
        failed++;
        console.error("Device delivery error:", deliveryError);
      }
    }

    // Deactivate confirmed expired/unregistered tokens.
    if (invalidTokenIds.length) {
      const { error: deactivateError } = await supabase
        .from("business_push_tokens")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .in("id", invalidTokenIds);

      if (deactivateError) {
        console.error(
          "Could not deactivate invalid tokens:",
          deactivateError.message,
        );
      }
    }

    return json({
      success: true,
      sent,
      failed,
      totalDevices: tokens.length,
      invalidTokens: invalidTokenIds.length,
    });
  } catch (error) {
    console.error("Push notification error:", error);

    return json({
      error: "Notification delivery failed.",
    }, 500);
  }
});
