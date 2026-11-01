const CSRF_STORAGE_KEY = "chowza_csrf_token";

function getFunctionsBaseUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("Supabase configuration is missing.");
  }

  return `${supabaseUrl.replace(/\/$/, "")}/functions/v1`;
}

export async function getCsrfToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    const cached = sessionStorage.getItem(CSRF_STORAGE_KEY);
    if (cached) return cached;
  }

  const response = await fetch(`${getFunctionsBaseUrl()}/csrf-token`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not initialise security protection. Please try again.");
  }

  const data = (await response.json()) as { token?: string };

  if (!data.token) {
    throw new Error("Could not initialise security protection. Please try again.");
  }

  sessionStorage.setItem(CSRF_STORAGE_KEY, data.token);
  return data.token;
}

export function clearCsrfToken(): void {
  sessionStorage.removeItem(CSRF_STORAGE_KEY);
}
