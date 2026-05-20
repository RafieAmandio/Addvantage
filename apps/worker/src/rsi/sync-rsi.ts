import { z } from "zod";
import * as Sentry from "@sentry/node";
import { prisma } from "@tradevantage/db";
import { FOREX_PAIRS, RSI_INTERVALS } from "@tradevantage/shared";
import { config } from "../lib/config";
import { retry } from "../lib/retry";
import { logger } from "../lib/logger";
import { toIsoUtc, delay } from "../lib/date";

const BASE = "https://api.twelvedata.com";

const RsiValueSchema = z.object({
  datetime: z.string().min(1),
  rsi: z.string(),
});

const RsiOkSchema = z.object({
  status: z.literal("ok"),
  values: z.array(RsiValueSchema).min(1),
});

const RsiErrorSchema = z.object({
  status: z.literal("error"),
  code: z.number().optional(),
  message: z.string(),
});

const RsiResponseSchema = z.union([RsiOkSchema, RsiErrorSchema]);

const PriceSchema = z.record(
  z.string(),
  z.object({ price: z.string() }).or(z.object({ code: z.number(), message: z.string() })),
);

const INTERVAL_MAP: Record<string, string> = {
  "1h": "1h",
  "4h": "4h",
  "1day": "1day",
};


interface RsiResult {
  symbol: string;
  interval: string;
  rsi: number;
  ts: string;
}

async function fetchRsi(
  symbol: string,
  interval: string,
  apiKey: string,
): Promise<RsiResult | null> {
  const params = new URLSearchParams({
    symbol,
    interval: INTERVAL_MAP[interval] ?? interval,
    time_period: "14",
    outputsize: "1",
    apikey: apiKey,
    format: "JSON",
  });

  const raw = await retry(
    async () => {
      const res = await fetch(`${BASE}/rsi?${params}`);
      if (!res.ok) throw new Error(`twelvedata/rsi: HTTP ${res.status}`);
      return (await res.json()) as unknown;
    },
    { label: `rsi:${symbol}:${interval}`, attempts: 2 },
  );

  const parsed = RsiResponseSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn({ symbol, interval, err: parsed.error.message }, "rsi: bad response shape");
    return null;
  }
  if (parsed.data.status === "error") {
    logger.warn({ symbol, interval, msg: parsed.data.message }, "rsi: API error");
    return null;
  }

  const val = parsed.data.values[0] as { datetime: string; rsi: string } | undefined;
  if (!val) return null;
  const rsi = Number(val.rsi);
  if (!Number.isFinite(rsi)) return null;

  return { symbol, interval, rsi, ts: toIsoUtc(val.datetime) };
}

async function fetchPrices(
  symbols: string[],
  apiKey: string,
): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  const csv = symbols.join(",");
  const params = new URLSearchParams({ symbol: csv, apikey: apiKey });

  try {
    const raw = await retry(
      async () => {
        const res = await fetch(`${BASE}/price?${params}`);
        if (!res.ok) throw new Error(`twelvedata/price: HTTP ${res.status}`);
        return (await res.json()) as unknown;
      },
      { label: "rsi:batch-price", attempts: 2 },
    );

    if (symbols.length === 1) {
      const single = z.object({ price: z.string() }).safeParse(raw);
      if (single.success) {
        const p = Number(single.data.price);
        if (Number.isFinite(p)) prices.set(symbols[0]!, p);
      }
      return prices;
    }

    const parsed = PriceSchema.safeParse(raw);
    if (!parsed.success) return prices;

    for (const [sym, val] of Object.entries(parsed.data)) {
      if ("price" in val) {
        const p = Number(val.price);
        if (Number.isFinite(p)) prices.set(sym, p);
      }
    }
  } catch (err) {
    logger.warn({ err: String(err) }, "rsi: batch price fetch failed (non-fatal)");
  }

  return prices;
}

export async function syncRsi(): Promise<void> {
  const apiKey = config.MARKET_DATA_API_KEY;
  if (!apiKey) {
    logger.debug("rsi-sync: MARKET_DATA_API_KEY not set, skipping");
    return;
  }

  const delayMs = config.RSI_REFRESH_DELAY_MS;
  const symbols = FOREX_PAIRS.map((p) => p.symbol);
  const results: RsiResult[] = [];
  let errors = 0;

  logger.info(
    { symbols: symbols.length, intervals: RSI_INTERVALS.length, delayMs },
    "rsi-sync: starting",
  );

  for (const interval of RSI_INTERVALS) {
    for (const symbol of symbols) {
      try {
        const r = await fetchRsi(symbol, interval, apiKey);
        if (r) results.push(r);
        else errors++;
      } catch (err) {
        errors++;
        logger.error({ symbol, interval, err: String(err) }, "rsi-sync: fetch failed");
      }
      await delay(delayMs);
    }
  }

  const prices = await fetchPrices(symbols, apiKey);

  if (results.length === 0) {
    logger.warn("rsi-sync: no results to persist");
    return;
  }

  const values = results.map((r) => ({
    symbol: r.symbol,
    interval: r.interval,
    rsi: r.rsi,
    price: prices.get(r.symbol) ?? null,
    ts: new Date(r.ts),
    fetchedAt: new Date(),
  }));

  const placeholders: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  for (const v of values) {
    placeholders.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5})`);
    params.push(v.symbol, v.interval, v.rsi, v.price, v.ts, v.fetchedAt);
    idx += 6;
  }

  await prisma.$executeRawUnsafe(
    `INSERT INTO rsi_snapshots (symbol, interval, rsi, price, ts, fetched_at)
     VALUES ${placeholders.join(", ")}
     ON CONFLICT (symbol, interval) DO UPDATE SET
       rsi = EXCLUDED.rsi,
       price = EXCLUDED.price,
       ts = EXCLUDED.ts,
       fetched_at = EXCLUDED.fetched_at`,
    ...params,
  );

  logger.info(
    { persisted: results.length, errors, pricesFound: prices.size },
    "rsi-sync: done",
  );
}
