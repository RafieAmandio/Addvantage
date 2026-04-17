import { NextResponse } from "next/server";
import { z } from "zod";
import { listBars } from "@/features/chart/queries/bars";
import { logger } from "@/lib/logger";

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
      { status: 400 },
    );
  }
  const { symbol, interval, limit } = parsed.data;
  const to = parsed.data.to ?? new Date();
  const from = parsed.data.from ?? new Date(to.getTime() - THIRTY_DAYS_MS);

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
      { status: 200 },
    );
  } catch (err) {
    logger.error("/api/bars failed", {
      error: err,
      scope: "api.bars",
      symbol,
      interval,
    });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
