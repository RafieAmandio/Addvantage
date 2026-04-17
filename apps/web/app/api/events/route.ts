import { NextResponse } from "next/server";
import { z } from "zod";
import { listTimelineEvents } from "@/features/timeline/queries/timeline";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const InputSchema = z.object({
  symbols: z
    .string()
    .min(1)
    .transform((s) =>
      s
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0),
    )
    .pipe(z.array(z.string().min(1).max(32)).min(1).max(32)),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
});

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbolsRaw = [
    ...url.searchParams.getAll("symbols"),
    ...url.searchParams.getAll("symbols[]"),
  ].join(",");
  const raw = {
    symbols: symbolsRaw,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  };
  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const { symbols, limit } = parsed.data;
  const to = parsed.data.to ?? new Date();
  const from = parsed.data.from ?? new Date(to.getTime() - THIRTY_DAYS_MS);

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rlKey = `events:${ip}:${symbols.slice().sort().join("|")}`;
  const rl = await rateLimit({
    key: rlKey,
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
    const events = await listTimelineEvents({
      symbols,
      from: from.toISOString(),
      to: to.toISOString(),
      limit,
    });
    return NextResponse.json(
      {
        symbols,
        from: from.toISOString(),
        to: to.toISOString(),
        events,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (err) {
    logger.error("/api/events failed", {
      error: err,
      scope: "api.events",
      symbols,
    });
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
