import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { supabaseServer } from "@/lib/supabase/server";
import { NEWS_LIST_COLUMNS } from "@/features/news/queries/news";
import { enforceIpRateLimit } from "@/lib/ip-ratelimit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  try {
    await enforceIpRateLimit(ip, "api:search", {
      limit: 30,
      windowSec: 60,
      scope: "api.search",
    });
  } catch (err) {
    if (err instanceof Error && err.message === "rate_limited") {
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } },
      );
    }
    throw err;
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  try {
    const pattern = `%${q}%`;
    const { data } = await supabaseServer()
      .from("news_items")
      .select(NEWS_LIST_COLUMNS)
      .eq("status", "approved")
      .or(`headline.ilike.${pattern},analysis.ilike.${pattern},author.ilike.${pattern}`)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(20);

    return NextResponse.json({ results: data ?? [] });
  } catch (err) {
    Sentry.captureException(err, { tags: { scope: "api.search" } });
    logger.error("/api/search failed", { error: err, scope: "api.search", q });
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
