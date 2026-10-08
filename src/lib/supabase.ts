import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** True when Supabase keys are configured. Without them the app runs in local demo mode. */
export const supabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

/** Browser Supabase client. Row-level security in the database is what protects the data. */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!client) client = createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return client;
}
