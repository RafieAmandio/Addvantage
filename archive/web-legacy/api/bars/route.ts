import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { listBars } from "@/features/chart/queries/bars";
import { getProfile } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { enforceTierRateLimit, type Tier } from "@/lib/ratelimit-tier";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const InputSchema = z.object({
  symbol: z.string().min(1).max(32),
  interval: z.enum(["1m", "5m", "1h", "1d"]).default("1h"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(5000).optional(),
});

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const { symbol, interval, limit } = parsed.data;
  const to = parsed.data.to ?? new Date();
  const from = parsed.data.from ?? new Date(to.getTime() - THIRTY_DAYS_MS);

  const profile = await getProfile();
  let rl;
  if (profile) {
    let tier: Tier = "free";
    if (profile.tier === "vip" || profile.tier === "free") {
      tier = profile.tier;
    }
    rl = await enforceTierRateLimit({
      userId: profile.id,
      tier,
      action: "api:bars",
    });
  } else {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    rl = await enforceTierRateLimit({ ip, action: "api:bars" });
  }
  if (!rl.success) {
    const retryAfter = rl.reset
      ? Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000))
      : 60;
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const bars = await listBars({ symbol, interval, from, to, limit });
    return NextResponse.json(
      {
        symbol,
        interval,
        from: from.toISOString(),
        to: to.toISOString(),
        bars,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (err) {
    Sentry.captureException(err, { tags: { scope: "api.bars" } });
    logger.error("/api/bars failed", {
      error: err,
      scope: "api.bars",
      symbol,
      interval,
    });
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
