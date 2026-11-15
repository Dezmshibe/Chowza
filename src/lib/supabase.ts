
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase configuration is missing. Check your .env.local file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
// TEMPORARY: Retrieve the current user's access token for testing
export async function getWhatsAppTestSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Session error:", error.message);
    return;
  }

  if (!data.session) {
    console.error("No active Supabase session found.");
    return;
  }

  console.log("Authenticated user:", data.session.user.email);
  console.log("Access token available:", Boolean(data.session.access_token));

  return data.session.access_token;
}
// Temporary browser-console access for local testing only
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as any).getWhatsAppTestSession = getWhatsAppTestSession;
}