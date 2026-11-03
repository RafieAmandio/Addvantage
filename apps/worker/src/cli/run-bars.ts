/**
 * One-shot CLI: fetch OHLCV bars for a single symbol via the configured
 * market-data provider and upsert them into `public.instrument_bars`.
 *
 * Usage:
 *   pnpm --filter @tradevantage/worker run:bars SPX
 *   pnpm --filter @tradevantage/worker run:bars EUR/USD 1h
 *   pnpm --filter @tradevantage/worker run:bars BTC/USD 1d
 *
 * Args:
 *   <SYMBOL>     Canonical symbol (e.g. SPX, EUR/USD, BTC/USD). Required.
 *   [INTERVAL]   One of 1m | 5m | 1h | 1d. Default: 1h.
 *
 * Window: last 30 days up to now().
 */
import { logger } from "../lib/logger";
import { singleflight } from "../lib/singleflight";
import type { Bar, Interval } from "../adapters/bars";
import { adapterFor, upsertBars } from "../bars/sync-bars";

const VALID_INTERVALS: readonly Interval[] = ["1m", "5m", "1h", "1d"];

function isInterval(v: string): v is Interval {
  return (VALID_INTERVALS as readonly string[]).includes(v);
}

async function main() {
  const symbol = process.argv[2];
  const intervalArg = process.argv[3] ?? "1h";

  if (!symbol) {
    console.error(
      "usage: run:bars <SYMBOL> [INTERVAL]\n" +
        "  SYMBOL    canonical symbol, e.g. SPX, EUR/USD, BTC/USD\n" +
        `  INTERVAL  one of ${VALID_INTERVALS.join(" | ")} (default 1h)`
    );
    process.exit(1);
  }

  if (!isInterval(intervalArg)) {
    console.error(
      `invalid interval "${intervalArg}". expected one of: ${VALID_INTERVALS.join(
        ", "
      )}`
    );
    process.exit(1);
  }
  const interval: Interval = intervalArg;

  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  const adapter = adapterFor(symbol);

  logger.info(
    {
      symbol,
      interval,
      provider: adapter.code,
      from: from.toISOString(),
      to: to.toISOString(),
    },
    "run:bars: fetching"
  );

  const sfKey = `bars:${adapter.code}:${symbol}:${interval}:${from.toISOString()}:${to.toISOString()}`;
  const bars = await singleflight<Bar[]>(sfKey, 30, () =>
    adapter.fetchBars({ symbol, interval, from, to }),
  );

  logger.info(
    { symbol, interval, count: bars.length },
    "run:bars: fetched, upserting"
  );

  if (bars.length === 0) {
    logger.warn(
      { symbol, interval },
      "run:bars: provider returned 0 bars; nothing to upsert"
    );
    console.log(`[bars] ${symbol} ${interval}: 0 bars fetched, 0 upserted`);
    process.exit(0);
  }

  await upsertBars(symbol, interval, bars);


  logger.info(
    { symbol, interval, upserted: bars.length },
    "run:bars: done"
  );
  console.log(
    `[bars] ${symbol} ${interval}: ${bars.length} bars fetched, ${bars.length} upserted`
  );
  process.exit(0);
}

void main().catch((err) => {
  logger.error({ err: String(err) }, "run:bars: fatal");
  process.exit(1);
});
