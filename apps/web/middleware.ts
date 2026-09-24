import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/auth/middleware";

// Serve the application flow on its own subdomain from the *same* web app
// (no separate deployment). apply.tradevantage.gg/ rewrites to the internal
// /early-access route; everything else on that host still resolves normally.
// early.tradevantage.gg stays as an alias so older links keep working.
const APPLY_HOSTS = new Set(["apply.tradevantage.gg", "early.tradevantage.gg"]);
// giveaway.tradevantage.gg/ rewrites to the internal /giveaway route.
const GIVEAWAY_HOST = "giveaway.tradevantage.gg";

export async function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0];
  if (request.nextUrl.pathname === "/") {
    if (APPLY_HOSTS.has(host)) {
      const url = request.nextUrl.clone();
      url.pathname = "/early-access";
      return NextResponse.rewrite(url);
    }
    if (host === GIVEAWAY_HOST) {
      const url = request.nextUrl.clone();
      url.pathname = "/giveaway";
      return NextResponse.rewrite(url);
    }
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
