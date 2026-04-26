import { createClient } from "@supabase/supabase-js";
import type { Database } from "@tradevantage/db";
import { publicConfig } from "@/lib/config/public";
import { serverConfig } from "@/lib/config/server";

export function supabaseAdmin() {
  const key = serverConfig.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
  return createClient<Database>(
    publicConfig.NEXT_PUBLIC_SUPABASE_URL,
    key,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
