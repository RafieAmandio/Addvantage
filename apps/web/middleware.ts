import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/auth/middleware";

// Serve the early-access flow on its own subdomain from the *same* web app
// (no separate deployment). early.tradevantage.gg/ rewrites to the internal
// /early-access route; everything else on that host still resolves normally.
const EARLY_ACCESS_HOST = "early.tradevantage.gg";

export async function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0];
  if (host === EARLY_ACCESS_HOST && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/early-access";
    return NextResponse.rewrite(url);
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
