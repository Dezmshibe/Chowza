export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type RateLimitClient = {
  rpc: (
    functionName: string,
    params: Record<string, unknown>,
  ) => Promise<{
    data: unknown;
    error: unknown;
  }>;
};

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function getClientIp(req: Request): string {
  const ip = req.headers.get("cf-connecting-ip")?.trim();

  if (!ip || ip.length > 45) {
    throw new Error("Trusted client IP is unavailable.");
  }

  // Validate IPv4 or IPv6 using the runtime URL parser.
  try {
    new URL(`http://[${ip}]/`);
    if (!ip.includes(":")) {
      throw new Error("Not IPv6");
    }
  } catch {
    const ipv4Parts = ip.split(".");

    const validIPv4 =
      ipv4Parts.length === 4 &&
      ipv4Parts.every(
        (part) =>
          /^\d{1,3}$/.test(part) &&
          Number(part) >= 0 &&
          Number(part) <= 255,
      );

    if (!validIPv4) {
      throw new Error("Invalid trusted client IP.");
    }
  }

  return ip;
}

export async function checkRateLimit(
  supabaseAdmin: RateLimitClient,
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  if (
    !key ||
    !Number.isInteger(maxRequests) ||
    maxRequests < 1 ||
    !Number.isInteger(windowSeconds) ||
    windowSeconds < 1
  ) {
    throw new Error("Invalid rate-limit configuration.");
  }

  const keyHash = await sha256(key);

  const { data, error } = await supabaseAdmin.rpc(
    "consume_request_rate_limit",
    {
      p_key_hash: keyHash,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    },
  );

  if (error) {
    console.error("Rate-limit database check failed:", error);
    throw new Error("Rate-limit verification failed.");
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (
    typeof result !== "object" ||
    result === null ||
    !("allowed" in result) ||
    !("remaining" in result) ||
    !("retry_after_seconds" in result) ||
    typeof result.allowed !== "boolean" ||
    typeof result.remaining !== "number" ||
    !Number.isInteger(result.remaining) ||
    typeof result.retry_after_seconds !== "number" ||
    !Number.isInteger(result.retry_after_seconds)
  ) {
    throw new Error("Invalid rate-limit database response.");
  }

  return {
    allowed: result.allowed,
    remaining: result.remaining,
    retryAfterSeconds: result.retry_after_seconds,
  };
}

export function rateLimitResponse(
  retryAfterSeconds: number,
  corsHeaders: Record<string, string> = {},
): Response {
  return Response.json(
    {
      error: "Too many requests. Please try again later.",
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Retry-After": String(Math.max(1, retryAfterSeconds)),
      },
    },
  );
}