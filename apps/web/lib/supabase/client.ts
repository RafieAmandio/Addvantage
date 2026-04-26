"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@tradevantage/db";
import { publicConfig } from "@/lib/config/public";

export function supabaseBrowser() {
  return createBrowserClient<Database>(
    publicConfig.NEXT_PUBLIC_SUPABASE_URL,
    publicConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
