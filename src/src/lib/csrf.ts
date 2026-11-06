
const CSRF_STORAGE_KEY = "chowza_csrf_token";
const CSRF_TOKEN_TTL_MS = 30 * 60 * 1000;
const CSRF_REFRESH_BUFFER_MS = 60 * 1000;

type CsrfTokenResponse = {
  token?: string;
};

function getFunctionsBaseUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("Supabase configuration is missing.");
  }

  return `${supabaseUrl.replace(/\/+$/, "")}/functions/v1`;
}

function isTokenFresh(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const timestamp = Number(parts[0]);

  if (!Number.isFinite(timestamp)) return false;

  const age = Date.now() - timestamp;

  return (
    age >= 0 &&
    age < CSRF_TOKEN_TTL_MS - CSRF_REFRESH_BUFFER_MS
  );
}

export async function getCsrfToken(
  forceRefresh = false,
): Promise<string> {
  if (!forceRefresh) {
    const cached = sessionStorage.getItem(CSRF_STORAGE_KEY);

    if (cached && isTokenFresh(cached)) {
      return cached;
    }
  }

  sessionStorage.removeItem(CSRF_STORAGE_KEY);

  const response = await fetch(
    `${getFunctionsBaseUrl()}/csrf-token`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Could not initialise security protection. Please try again.",
    );
  }

  const data =
    (await response.json()) as CsrfTokenResponse;

  if (!data.token || !isTokenFresh(data.token)) {
    throw new Error(
      "The security server returned an invalid token. Please refresh the page.",
    );
  }

  sessionStorage.setItem(CSRF_STORAGE_KEY, data.token);

  return data.token;
}

export function clearCsrfToken(): void {
  sessionStorage.removeItem(CSRF_STORAGE_KEY);
}
