const CSRF_TOKEN_TTL_MS = 30 * 60 * 1000;

const DEFAULT_ALLOWED_ORIGINS = [
  "https://chowza.onrender.com",
  "capacitor://localhost",
  "http://localhost",
  "http://localhost:5173",
  "http://localhost:4173",
];

function getAllowedOrigins(): string[] {
  const configured = Deno.env.get("CSRF_ALLOWED_ORIGINS")
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configured?.length
    ? configured
    : DEFAULT_ALLOWED_ORIGINS;
}

function getSecret(): string {
  const secret =
    Deno.env.get("CSRF_SECRET") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!secret) {
    throw new Error("CSRF secret is not configured.");
  }

  return secret;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return bytes;
}

async function sign(value: string): Promise<string> {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(value),
  );

  return bytesToHex(new Uint8Array(signature));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

export function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");

  // Native Capacitor requests may not include Origin.
  // The CSRF token is still required for protected POST requests.
  if (!origin) {
    return true;
  }

  return getAllowedOrigins().includes(origin);
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();

  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-csrf-token",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

export async function createCsrfToken(): Promise<string> {
  const timestamp = Date.now().toString();
  const nonce = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));

  const payload = `${timestamp}.${nonce}`;
  const signature = await sign(payload);

  return `${payload}.${signature}`;
}

export async function verifyCsrfToken(
  token: string | null,
): Promise<boolean> {
  if (!token) {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return false;
  }

  const [timestamp, nonce, receivedSignature] = parts;

  if (!timestamp || !nonce || !receivedSignature) {
    return false;
  }

  const timestampNumber = Number(timestamp);

  if (!Number.isFinite(timestampNumber)) {
    return false;
  }

  if (Math.abs(Date.now() - timestampNumber) > CSRF_TOKEN_TTL_MS) {
    return false;
  }

  const expectedSignature = await sign(
    `${timestamp}.${nonce}`,
  );

  return constantTimeEqual(
    expectedSignature,
    receivedSignature,
  );
}

export async function requireCsrf(
  req: Request,
): Promise<Response | null> {
  if (!isAllowedOrigin(req)) {
    return new Response(
      JSON.stringify({
        error: "Request origin is not allowed.",
      }),
      {
        status: 403,
        headers: {
          ...getCorsHeaders(req),
          "Content-Type": "application/json",
        },
      },
    );
  }

  const token = req.headers.get("x-csrf-token");

  if (!(await verifyCsrfToken(token))) {
    return new Response(
      JSON.stringify({
        error: "Invalid or missing CSRF token.",
      }),
      {
        status: 403,
        headers: {
          ...getCorsHeaders(req),
          "Content-Type": "application/json",
        },
      },
    );
  }

  return null;
}
