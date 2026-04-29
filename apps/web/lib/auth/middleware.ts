import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { isMockMode } from "@/lib/config/public";

export async function updateSession(request: NextRequest) {
  if (isMockMode()) {
    return NextResponse.next({ request });
  }

  const { pathname } = request.nextUrl;
  const isProtected =
    pathname.startsWith("/app") || pathname.startsWith("/admin");

  if (!isProtected) {
    return NextResponse.next({ request });
  }

  const token = request.cookies.get("access_token")?.value;
  if (!token) {
    return redirectToLogin(request, pathname);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return redirectToLogin(request, pathname);
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next({ request });
  } catch {
    return redirectToLogin(request, pathname);
  }
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}
