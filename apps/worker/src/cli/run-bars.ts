/**
 * One-shot CLI: fetch OHLCV bars for a single symbol via the configured
 * market-data provider and upsert them into `public.instrument_bars`.
 *
 * Mirrors `run-once.ts` for news adapters. Useful for manual backfills and
 * smoke-testing the bars pipeline without running the scheduler.
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
import { config } from "../lib/config";
import { logger } from "../lib/logger";
import { retry } from "../lib/retry";
import { singleflight } from "../lib/singleflight";
import { supabase } from "../lib/supabase";
import { getBarsAdapter, type Bar, type Interval } from "../adapters/bars";

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

  if (!config.MARKET_DATA_PROVIDER) {
    console.error(
      "MARKET_DATA_PROVIDER is not set. Configure MARKET_DATA_PROVIDER and " +
        "MARKET_DATA_API_KEY in apps/worker/.env (see apps/worker/.env.example)."
    );
    process.exit(1);
  }

  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  const adapter = getBarsAdapter(config.MARKET_DATA_PROVIDER);

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

  // Coalesce concurrent invocations with the same (provider, symbol,
   // interval, window) onto a single Twelve Data call. Ten-second request
   // bursts from parallel CLI runs or retries thus share one upstream hit.
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
    // eslint-disable-next-line no-console
    console.log(`[bars] ${symbol} ${interval}: 0 bars fetched, 0 upserted`);
    process.exit(0);
  }

  const rows = bars.map((b) => ({
    symbol,
    interval,
    ts: b.ts,
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
    volume: b.volume,
  }));

  const { error } = await retry(
    async () =>
      supabase()
        .from("instrument_bars")
        .upsert(rows, { onConflict: "symbol,interval,ts" }),
    { label: "supabase.instrument_bars.upsert", attempts: 3 }
  );

  if (error) {
    logger.error(
      { err: error.message, symbol, interval },
      "run:bars: upsert failed"
    );
    process.exit(1);
  }

  logger.info(
    { symbol, interval, upserted: rows.length },
    "run:bars: done"
  );
  // eslint-disable-next-line no-console
  console.log(
    `[bars] ${symbol} ${interval}: ${bars.length} bars fetched, ${rows.length} upserted`
  );
  process.exit(0);
}

void main().catch((err) => {
  logger.error({ err: String(err) }, "run:bars: fatal");
  process.exit(1);
});
