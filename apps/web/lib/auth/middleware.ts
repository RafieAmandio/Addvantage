import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { isMockMode } from "@/lib/config/public";
import { serverConfig } from "@/lib/config/server";

const secret = new TextEncoder().encode(serverConfig.JWT_SECRET);

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

  if (token) {
    try {
      await jwtVerify(token, secret);
      return NextResponse.next({ request });
    } catch {
      // Access token expired — try refresh below
    }
  }

  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (!refreshToken) {
    return redirectToLogin(request, pathname);
  }

  try {
    await jwtVerify(refreshToken, secret);
  } catch {
    return redirectToLogin(request, pathname);
  }

  try {
    const apiUrl = serverConfig.NEXT_PUBLIC_API_URL;
    const res = await fetch(`${apiUrl}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      return redirectToLogin(request, pathname);
    }

    const json = (await res.json()) as {
      data: { accessToken: string; refreshToken: string };
    };
    const { accessToken: newAccess, refreshToken: newRefresh } = json.data;

    const response = NextResponse.next({ request });
    const isProduction = serverConfig.NODE_ENV === "production";

    response.cookies.set("access_token", newAccess, {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });
    response.cookies.set("refresh_token", newRefresh, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
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
