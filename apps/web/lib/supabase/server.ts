import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@tradevantage/db";
import { publicConfig } from "@/lib/config/public";

/**
 * Server-side Supabase client — reads the session cookie from next/headers.
 * Use this inside Server Components, Server Actions, and Route Handlers.
 */
export function supabaseServer(): SupabaseClient<Database> {
  const cookieStore = cookies();
  return createServerClient<Database>(
    publicConfig.NEXT_PUBLIC_SUPABASE_URL,
    publicConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore if middleware
            // is refreshing sessions.
          }
        },
      },
    }
  ) as unknown as SupabaseClient<Database>;
}
