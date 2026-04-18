import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@tradevantage/db";
import { publicConfig } from "@/lib/config/public";

/**
 * Refresh Supabase session cookies on every request. Called from
 * app/middleware.ts. Keeps SSR auth fresh without forcing a client round-trip.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicConfig.NEXT_PUBLIC_SUPABASE_URL,
    publicConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gate authenticated surfaces. Admin is also gated at the layout level via
  // getProfile()/requireAdmin; this is defense-in-depth so an unauthenticated
  // request never reaches a Server Component that might read PII.
  const { pathname } = request.nextUrl;
  const isProtected =
    pathname.startsWith("/app") || pathname.startsWith("/admin");
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return response;
}
