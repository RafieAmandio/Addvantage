import { cache } from "react";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { getCache, setCache } from "@/lib/cache";
import { logger } from "@/lib/logger";

/**
 * OHLCV bar shape for the chart feature. Source of truth on the write side
 * is `apps/worker/src/adapters/bars/base.ts` (Bar interface) — redeclared
 * here because worker code is not cleanly importable from the web app
 * (separate package boundaries, no build step bridging them). Keep the two
 * in sync; both mirror the `public.instrument_bars` columns in
 * `packages/db/src/types.ts`.
 *
 * Columns in DB are nullable (Row.open/high/low/close/volume), so the schema
 * matches that. Callers can drop rows with null OHLC if they need a strict
 * series.
 */
export const BarSchema = z.object({
  ts: z.string(),
  open: z.number().nullable(),
  high: z.number().nullable(),
  low: z.number().nullable(),
  close: z.number().nullable(),
  volume: z.number().nullable(),
});
export type Bar = z.infer<typeof BarSchema>;

const BAR_COLUMNS = "ts,open,high,low,close,volume";
const DEFAULT_LIMIT = 5000;

export interface ListBarsInput {
  symbol: string;
  interval: "1m" | "5m" | "1h" | "1d";
  from: Date;
  to: Date;
  limit?: number;
}

const CACHE_TTL_SEC = 60;

async function listBarsFromDb(input: ListBarsInput): Promise<Bar[]> {
  const { symbol, interval, from, to } = input;
  const limit = input.limit ?? DEFAULT_LIMIT;
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("instrument_bars")
    .select(BAR_COLUMNS)
    .eq("symbol", symbol)
    .eq("interval", interval)
    .gte("ts", from.toISOString())
    .lte("ts", to.toISOString())
    .order("ts", { ascending: true })
    .limit(limit);
  if (error) {
    logger.error("listBars failed", { error, scope: "chart.listBars" });
    return [];
  }
  const parsed = BarSchema.array().safeParse(data ?? []);
  if (!parsed.success) {
    logger.error("listBars shape mismatch", {
      issues: parsed.error.issues,
      scope: "chart.listBars",
    });
    return [];
  }
  return parsed.data;
}

/**
 * Read OHLCV bars for a given symbol/interval in a time window.
 *
 * Layered caching:
 *  - `React.cache` dedupes multiple calls with the same args within a single
 *    Server Component request.
 *  - Upstash Redis (`getCache`/`setCache`, no-op when env unset) dedupes
 *    across requests for 60s.
 *  - On miss, the Supabase read is the source of truth.
 *
 * Returns `[]` on DB error or schema mismatch (logged via `logger.error`).
 */
export const listBars = cache(async (input: ListBarsInput): Promise<Bar[]> => {
  const { symbol, interval, from, to } = input;
  const limit = input.limit ?? DEFAULT_LIMIT;
  const key = `bars:${symbol}:${interval}:${from.toISOString()}:${to.toISOString()}:${limit}`;

  const cached = await getCache<Bar[]>(key);
  if (cached !== null) {
    const parsed = BarSchema.array().safeParse(cached);
    if (parsed.success) return parsed.data;
    logger.error("listBars cache shape mismatch", {
      issues: parsed.error.issues,
      scope: "chart.listBars",
    });
  }

  const result = await listBarsFromDb({ symbol, interval, from, to, limit });
  await setCache(key, result, CACHE_TTL_SEC);
  return result;
});
