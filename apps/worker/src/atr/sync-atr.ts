import { z } from "zod";
import * as Sentry from "@sentry/node";
import { prisma } from "@tradevantage/db";
import { FOREX_PAIRS, ATR_PERIOD } from "@tradevantage/shared";
import { config } from "../lib/config";
import { retry } from "../lib/retry";
import { logger } from "../lib/logger";
import { toIsoUtc, delay } from "../lib/date";
import { getNextApiKey } from "../lib/api-key-pool";

const BASE = "https://api.twelvedata.com";

const CandleSchema = z.object({
  datetime: z.string().min(1),
  open: z.string(),
  high: z.string(),
  low: z.string(),
  close: z.string(),
});

const OkSchema = z.object({
  status: z.literal("ok"),
  values: z.array(CandleSchema),
});

const ErrorSchema = z.object({
  status: z.literal("error"),
  code: z.number().optional(),
  message: z.string(),
});

const ResponseSchema = z.union([OkSchema, ErrorSchema]);

interface Candle {
  high: number;
  low: number;
  close: number;
  open: number;
  datetime: string;
}

interface AtrResult {
  symbol: string;
  atr: number;
  price: number;
  dailyOpen: number;
  dailyHigh: number;
  dailyLow: number;
  dailyClose: number;
  upperLevel: number;
  lowerLevel: number;
  exhaustionPct: number;
  direction: "bullish" | "bearish";
  ts: string;
}

function computeAtr(candles: Candle[], period: number): number {
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const { high, low } = candles[i]!;
    const prevClose = candles[i - 1]!.close;
    trs.push(
      Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)),
    );
  }

  let atr = trs.slice(0, period).reduce((s, v) => s + v, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]!) / period;
  }
  return atr;
}

async function fetchDailyCandles(
  symbol: string,
  apiKey: string,
): Promise<Candle[] | null> {
  const params = new URLSearchParams({
    symbol,
    interval: "1day",
    outputsize: "100",
    apikey: apiKey,
    format: "JSON",
    timezone: "UTC",
  });

  const raw = await retry(
    async () => {
      const res = await fetch(`${BASE}/time_series?${params}`);
      if (!res.ok) throw new Error(`twelvedata: HTTP ${res.status}`);
      return (await res.json()) as unknown;
    },
    { label: `atr:${symbol}`, attempts: 2 },
  );

  const parsed = ResponseSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn({ symbol, err: parsed.error.message }, "atr: bad response shape");
    return null;
  }
  if (parsed.data.status === "error") {
    logger.warn({ symbol, msg: parsed.data.message }, "atr: API error");
    return null;
  }

  const candles: Candle[] = parsed.data.values.map((v) => ({
    datetime: v.datetime,
    open: Number(v.open),
    high: Number(v.high),
    low: Number(v.low),
    close: Number(v.close),
  }));

  // TwelveData returns newest-first; sort chronologically
  candles.sort((a, b) => (a.datetime < b.datetime ? -1 : 1));
  return candles;
}

export async function syncAtr(): Promise<void> {
  if (!config.MARKET_DATA_API_KEY) {
    logger.debug("atr-sync: MARKET_DATA_API_KEY not set, skipping");
    return;
  }

  const delayMs = config.RSI_REFRESH_DELAY_MS;
  const symbols = FOREX_PAIRS.map((p) => p.symbol);
  const results: AtrResult[] = [];
  let errors = 0;

  logger.info(
    { symbols: symbols.length, period: ATR_PERIOD, delayMs },
    "atr-sync: starting",
  );

  for (const symbol of symbols) {
    try {
      const candles = await fetchDailyCandles(symbol, getNextApiKey());
      if (!candles || candles.length < ATR_PERIOD + 2) {
        logger.warn({ symbol, count: candles?.length }, "atr: insufficient candles");
        errors++;
        await delay(delayMs);
        continue;
      }

      const atr = computeAtr(candles, ATR_PERIOD);
      if (!Number.isFinite(atr) || atr <= 0) {
        logger.warn({ symbol, atr }, "atr: invalid ATR value");
        errors++;
        await delay(delayMs);
        continue;
      }

      const today = candles[candles.length - 1]!;
      const upperLevel = today.low + atr;
      const lowerLevel = today.high - atr;
      const dailyRange = today.high - today.low;
      const exhaustionPct = (dailyRange / atr) * 100;

      results.push({
        symbol,
        atr,
        price: today.close,
        dailyOpen: today.open,
        dailyHigh: today.high,
        dailyLow: today.low,
        dailyClose: today.close,
        upperLevel,
        lowerLevel,
        exhaustionPct,
        direction: today.close >= today.open ? "bullish" : "bearish",
        ts: toIsoUtc(today.datetime),
      });
    } catch (err) {
      errors++;
      logger.error({ symbol, err: String(err) }, "atr-sync: fetch failed");
    }
    await delay(delayMs);
  }

  if (results.length === 0) {
    logger.warn("atr-sync: no results to persist");
    return;
  }

  const placeholders: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  for (const r of results) {
    placeholders.push(
      `($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7}, $${idx + 8}, $${idx + 9}, $${idx + 10}, $${idx + 11})`,
    );
    params.push(
      r.symbol,
      r.atr,
      r.price,
      r.dailyOpen,
      r.dailyHigh,
      r.dailyLow,
      r.dailyClose,
      r.upperLevel,
      r.lowerLevel,
      r.exhaustionPct,
      r.direction,
      new Date(r.ts),
    );
    idx += 12;
  }

  await prisma.$executeRawUnsafe(
    `INSERT INTO atr_snapshots (symbol, atr, price, daily_open, daily_high, daily_low, daily_close, upper_level, lower_level, exhaustion_pct, direction, ts)
     VALUES ${placeholders.join(", ")}
     ON CONFLICT (symbol) DO UPDATE SET
       atr = EXCLUDED.atr,
       price = EXCLUDED.price,
       daily_open = EXCLUDED.daily_open,
       daily_high = EXCLUDED.daily_high,
       daily_low = EXCLUDED.daily_low,
       daily_close = EXCLUDED.daily_close,
       upper_level = EXCLUDED.upper_level,
       lower_level = EXCLUDED.lower_level,
       exhaustion_pct = EXCLUDED.exhaustion_pct,
       direction = EXCLUDED.direction,
       ts = EXCLUDED.ts,
       fetched_at = now()`,
    ...params,
  );

  logger.info(
    { persisted: results.length, errors },
    "atr-sync: done",
  );
}
