"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@tradevantage/db";

/**
 * Browser-side Supabase client. Used by client components that need live data
 * or realtime subscriptions. Server components and route handlers should use
 * `supabaseServer()` from ./server instead.
 */
export function supabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
