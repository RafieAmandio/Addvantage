import { Router } from "express";
import type { Request, Response } from "express";
import { FOREX_PAIRS, boardRow, type Candle } from "@tradevantage/shared";
import { prisma } from "@/config/database.js";
import { optionalAuth } from "@/core/middleware/auth.middleware.js";
import { tierRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import type { AuthUser } from "@/core/types/request.js";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";

const router = Router();

const getTier = (req: Request) => {
  const user = (req as Request & { user?: AuthUser & { tier?: string } }).user;
  return user?.tier === "vip" ? ("vip" as const) : ("free" as const);
};

const DAY = 86_400_000;

async function candles(symbol: string, interval: "1h" | "1d", days: number): Promise<Candle[]> {
  const rows = await prisma.instrumentBar.findMany({
    where: { symbol, interval, ts: { gte: new Date(Date.now() - days * DAY) } },
    select: { ts: true, open: true, high: true, low: true, close: true },
    orderBy: { ts: "asc" },
  });
  return rows.flatMap((r) =>
    r.open === null || r.high === null || r.low === null || r.close === null
      ? []
      : [{ time: r.ts.toISOString(), open: Number(r.open), high: Number(r.high), low: Number(r.low), close: Number(r.close) }],
  );
}

/** Daily bias and best hourly level for every pair, from stored candles only (no live fallback). */
router.get(
  "/board",
  optionalAuth,
  tierRateLimit("api:method", getTier),
  asyncHandler(async (_req, res: Response) => {
    const rows = await Promise.all(
      FOREX_PAIRS.map(async (p) => {
        const [daily, hourly] = await Promise.all([candles(p.symbol, "1d", 200), candles(p.symbol, "1h", 14)]);
        return daily.length ? boardRow(p, daily, hourly) : null;
      }),
    );
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");
    sendSuccess(res, { rows: rows.filter(Boolean), generatedAt: new Date().toISOString() });
  }),
);

export { router as methodRoutes };
