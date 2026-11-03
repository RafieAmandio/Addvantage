import { prisma, Prisma } from "@tradevantage/db";
import { FOREX_PAIRS } from "@tradevantage/shared";
import { config } from "../lib/config";
import { logger } from "../lib/logger";
import { getBarsAdapter, type Bar, type BarsAdapter, type Interval } from "../adapters/bars";
import { toYahoo } from "../adapters/bars/yahoo";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** How far back each scheduled run fetches. */
const WINDOW_DAYS: Partial<Record<Interval, number>> = { "1h": 30, "1d": 365 };

// TwelveData free plan: indices, copper and WTI 404.
const PAID_ONLY = new Set(["HG1", "WTI/USD"]);
// Yahoo has only COMEX futures for gold, so it stays on TwelveData spot when a key exists.
// ponytail: silver 404s on the TwelveData free plan, so it uses Yahoo SI=F futures; move it here on a paid plan.
const SPOT_METALS = new Set(["XAU/USD"]);

/** Daily candles never fall on a weekend: Yahoo quotes FX past Friday's close and TwelveData prints Sat/Sun gold. */
const weekdaysOnly = (a: BarsAdapter): BarsAdapter => ({
  code: a.code,
  fetchBars: async (input) => {
    const bars = await a.fetchBars(input);
    return input.interval === "1d" ? bars.filter((b) => ![0, 6].includes(new Date(b.ts).getUTCDay())) : bars;
  },
});

/** The bars adapter for one symbol: spot gold on TwelveData when possible, the rest on BARS_PROVIDER. */
export function adapterFor(symbol: string): BarsAdapter {
  if (SPOT_METALS.has(symbol) && config.MARKET_DATA_API_KEY) return weekdaysOnly(getBarsAdapter("twelvedata"));
  return weekdaysOnly(getBarsAdapter(config.BARS_PROVIDER));
}

/** Every pair the configured provider can serve (Yahoo: all but XAU/EUR; TwelveData free: 13 pairs). */
export const BAR_SYMBOLS =
  config.BARS_PROVIDER === "yahoo"
    ? FOREX_PAIRS.map((p) => p.symbol).filter((s) => toYahoo(s))
    : FOREX_PAIRS.filter((p) => p.group !== "index" && p.tier !== "thirdliner" && !PAID_ONLY.has(p.symbol)).map((p) => p.symbol);

/** Pause after a call: TwelveData's free plan needs ~8s, Yahoo is fine with a short gap. */
export const pauseAfter = (adapter: BarsAdapter) => (adapter.code === "twelvedata" ? config.RSI_REFRESH_DELAY_MS : 400);

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
  const to = new Date();
  const from = new Date(to.getTime() - (WINDOW_DAYS[interval] ?? 30) * 86_400_000);
  let rows = 0;
  let errors = 0;

  for (const symbol of BAR_SYMBOLS) {
    const adapter = adapterFor(symbol);
    try {
      const bars = await adapter.fetchBars({ symbol, interval, from, to });
      await upsertBars(symbol, interval, bars);
      rows += bars.length;
    } catch (err) {
      errors++;
      logger.warn({ symbol, interval, err: String(err) }, "bars-sync: symbol failed");
    }
    await delay(pauseAfter(adapter));
  }

  logger.info({ interval, symbols: BAR_SYMBOLS.length, rows, errors }, "bars-sync: done");
  if (rows === 0 && errors > 0) throw new Error(`bars-sync ${interval}: all ${errors} symbols failed`);
}
