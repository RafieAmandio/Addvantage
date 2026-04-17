"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@tradevantage/db";
import { publicConfig } from "@/lib/config/public";

/**
 * Browser-side Supabase client. Used by client components that need live data
 * or realtime subscriptions. Server components and route handlers should use
 * `supabaseServer()` from ./server instead.
 */
export function supabaseBrowser() {
  return createBrowserClient<Database>(
    publicConfig.NEXT_PUBLIC_SUPABASE_URL,
    publicConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
