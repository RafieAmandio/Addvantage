import { createClient } from "@supabase/supabase-js";
import type { Database } from "@tradevantage/db";

/**
 * Service-role client. BYPASSES RLS. Only import from Route Handlers / Server
 * Actions that need elevated writes (e.g. admin bulk ops). Never ship in a
 * client bundle — keep the SERVICE_ROLE_KEY out of NEXT_PUBLIC_*.
 */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
