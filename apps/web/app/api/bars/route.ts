import { NextResponse } from "next/server";
import { z } from "zod";
import { listBars } from "@/features/chart/queries/bars";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/ratelimit";

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

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await rateLimit({
    key: `bars:${ip}:${symbol}:${interval}`,
    limit: 60,
    windowSec: 60,
  });
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
