import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "./config";

let client: SupabaseClient | null = null;

/**
 * Lazy service-role Supabase client. Bypasses RLS — only used inside the
 * worker, never exposed to a browser. Lazy so the adapter-only test scripts
 * can import modules that might transitively reach here without a key.
 */
export function supabase(): SupabaseClient {
  if (client) return client;
  if (!config.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — required for worker persistence"
    );
  }
  client = createClient(
    config.SUPABASE_URL,
    config.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-client-info": "tradevantage-worker/0.1" } },
    }
  );
  return client;
}
