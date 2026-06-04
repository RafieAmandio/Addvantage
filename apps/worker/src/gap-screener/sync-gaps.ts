import { z } from "zod";
import { prisma } from "@tradevantage/db";
import { FOREX_PAIRS } from "@tradevantage/shared";
import { config } from "../lib/config";
import { retry } from "../lib/retry";
import { logger } from "../lib/logger";
import { delay } from "../lib/date";
import { getNextApiKey } from "../lib/api-key-pool";

const BASE = "https://api.twelvedata.com";
const MIN_GAP_PCT = 0.3;

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
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface GapResult {
  symbol: string;
  fridayClose: number;
  mondayOpen: number;
  currentPrice: number;
  gapPct: number;
  gapDirection: "UP" | "DOWN";
  fillPct: number;
  status: "active" | "filled" | "expired";
  weekStart: string;
  ts: string;
}

async function fetchDailyCandles(
  symbol: string,
  apiKey: string,
): Promise<Candle[] | null> {
  const params = new URLSearchParams({
    symbol,
    interval: "1day",
    outputsize: "15",
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
    { label: `gap:${symbol}`, attempts: 2 },
  );

  const parsed = ResponseSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn({ symbol, err: parsed.error.message }, "gap: bad response shape");
    return null;
  }
  if (parsed.data.status === "error") {
    logger.warn({ symbol, msg: parsed.data.message }, "gap: API error");
    return null;
  }

  const candles: Candle[] = parsed.data.values.map((v) => ({
    datetime: v.datetime,
    open: Number(v.open),
    high: Number(v.high),
    low: Number(v.low),
    close: Number(v.close),
  }));

  candles.sort((a, b) => (a.datetime < b.datetime ? -1 : 1));

  return candles.filter((c) => {
    const day = new Date(c.datetime).getUTCDay();
    return day !== 0 && day !== 6;
  });
}

function findWeekendGap(candles: Candle[]): {
  fridayClose: number;
  mondayOpen: number;
  mondayDate: string;
} | null {
  for (let i = candles.length - 1; i >= 1; i--) {
    const curr = new Date(candles[i]!.datetime);
    const prev = new Date(candles[i - 1]!.datetime);
    const diffMs = curr.getTime() - prev.getTime();

    // Weekend gap: >2 days between trading days
    if (diffMs > 2 * 24 * 3600 * 1000) {
      return {
        fridayClose: candles[i - 1]!.close,
        mondayOpen: candles[i]!.open,
        mondayDate: candles[i]!.datetime,
      };
    }
  }
  return null;
}

export async function syncGaps(): Promise<void> {
  if (!config.MARKET_DATA_API_KEY) {
    logger.debug("gap-sync: MARKET_DATA_API_KEY not set, skipping");
    return;
  }

  const delayMs = config.RSI_REFRESH_DELAY_MS;
  const symbols = FOREX_PAIRS.map((p) => p.symbol);
  const results: GapResult[] = [];
  let errors = 0;

  logger.info({ symbols: symbols.length, delayMs }, "gap-sync: starting");

  for (const symbol of symbols) {
    try {
      const candles = await fetchDailyCandles(symbol, getNextApiKey());
      if (!candles || candles.length < 5) {
        errors++;
        await delay(delayMs);
        continue;
      }

      const gap = findWeekendGap(candles);
      if (!gap) {
        await delay(delayMs);
        continue;
      }

      const gapSize = gap.mondayOpen - gap.fridayClose;
      const gapPct = Math.abs(gapSize / gap.fridayClose) * 100;

      if (gapPct < MIN_GAP_PCT) {
        await delay(delayMs);
        continue;
      }

      const currentPrice = candles[candles.length - 1]!.close;
      const gapDirection: "UP" | "DOWN" = gapSize > 0 ? "UP" : "DOWN";

      // Fill progress: how much of the gap has been closed
      const fillAmount = gapDirection === "UP"
        ? gap.mondayOpen - currentPrice
        : currentPrice - gap.mondayOpen;
      const fillPct = Math.min(100, Math.max(0, (fillAmount / Math.abs(gapSize)) * 100));

      // Status
      const mondayDate = new Date(gap.mondayDate);
      const daysSinceMonday = (Date.now() - mondayDate.getTime()) / (24 * 3600 * 1000);
      let status: "active" | "filled" | "expired" = "active";
      if (fillPct >= 100) status = "filled";
      else if (daysSinceMonday > 4) status = "expired";

      const weekStart = gap.mondayDate.slice(0, 10);

      results.push({
        symbol,
        fridayClose: gap.fridayClose,
        mondayOpen: gap.mondayOpen,
        currentPrice,
        gapPct,
        gapDirection,
        fillPct,
        status,
        weekStart,
        ts: candles[candles.length - 1]!.datetime,
      });
    } catch (err) {
      errors++;
      logger.error({ symbol, err: String(err) }, "gap-sync: fetch failed");
    }
    await delay(delayMs);
  }

  if (results.length === 0) {
    logger.info({ errors }, "gap-sync: no gaps found");
    return;
  }

  const placeholders: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  for (const r of results) {
    placeholders.push(
      `($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7}, $${idx + 8}, $${idx + 9}, $${idx + 10})`,
    );
    params.push(
      r.symbol,
      r.fridayClose,
      r.mondayOpen,
      r.currentPrice,
      r.gapPct,
      r.gapDirection,
      r.fillPct,
      r.status,
      new Date(r.weekStart),
      new Date(r.ts),
      new Date(),
    );
    idx += 11;
  }

  await prisma.$executeRawUnsafe(
    `INSERT INTO gap_snapshots (symbol, friday_close, monday_open, current_price, gap_pct, gap_direction, fill_pct, status, week_start, ts, fetched_at)
     VALUES ${placeholders.join(", ")}
     ON CONFLICT (symbol, week_start) DO UPDATE SET
       current_price = EXCLUDED.current_price,
       fill_pct = EXCLUDED.fill_pct,
       status = EXCLUDED.status,
       ts = EXCLUDED.ts,
       fetched_at = EXCLUDED.fetched_at`,
    ...params,
  );

  logger.info(
    { persisted: results.length, errors },
    "gap-sync: done",
  );
}
