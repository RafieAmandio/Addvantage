import { prisma, Prisma } from "@tradevantage/db";
import { FOREX_PAIRS } from "@tradevantage/shared";
import { config } from "../lib/config";
import { logger } from "../lib/logger";
import { getBarsAdapter, type Bar, type Interval } from "../adapters/bars";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** How far back each scheduled run fetches. One credit per call either way. */
const WINDOW_DAYS: Partial<Record<Interval, number>> = { "1h": 30, "1d": 365 };

// Indices, copper and WTI 404 on the TwelveData free plan.
const PAID_ONLY = new Set(["HG1", "WTI/USD"]);
// ponytail: primary + secondary only (13 pairs, ~390 credits/day); add thirdliners if the credit budget allows.
export const BAR_SYMBOLS = FOREX_PAIRS.filter(
  (p) => p.group !== "index" && p.tier !== "thirdliner" && !PAID_ONLY.has(p.symbol),
).map((p) => p.symbol);

export async function upsertBars(symbol: string, interval: Interval, bars: Bar[]): Promise<void> {
  if (bars.length === 0) return;
  const values = bars.map(
    (b) =>
      Prisma.sql`(${symbol}, ${interval}, ${new Date(b.ts)}::timestamptz, ${b.open}::numeric, ${b.high}::numeric, ${b.low}::numeric, ${b.close}::numeric, ${b.volume}::numeric)`,
  );
  await prisma.$executeRaw`
    INSERT INTO instrument_bars (symbol, interval, ts, open, high, low, close, volume)
    VALUES ${Prisma.join(values)}
    ON CONFLICT (symbol, interval, ts)
    DO UPDATE SET
      open    = EXCLUDED.open,
      high    = EXCLUDED.high,
      low     = EXCLUDED.low,
      close   = EXCLUDED.close,
      volume  = EXCLUDED.volume
  `;
}

/** Refresh `instrument_bars` for every BAR_SYMBOLS pair at one interval. */
export async function syncBars(interval: Interval): Promise<void> {
  if (!config.MARKET_DATA_PROVIDER) return;
  const adapter = getBarsAdapter(config.MARKET_DATA_PROVIDER);
  const to = new Date();
  const from = new Date(to.getTime() - (WINDOW_DAYS[interval] ?? 30) * 86_400_000);
  let rows = 0;
  let errors = 0;

  for (const symbol of BAR_SYMBOLS) {
    try {
      const bars = await adapter.fetchBars({ symbol, interval, from, to });
      await upsertBars(symbol, interval, bars);
      rows += bars.length;
    } catch (err) {
      errors++;
      logger.warn({ symbol, interval, err: String(err) }, "bars-sync: symbol failed");
    }
    await delay(config.RSI_REFRESH_DELAY_MS);
  }

  logger.info({ interval, symbols: BAR_SYMBOLS.length, rows, errors }, "bars-sync: done");
  if (rows === 0 && errors > 0) throw new Error(`bars-sync ${interval}: all ${errors} symbols failed`);
}
