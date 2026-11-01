"use server";

import type { Candle } from "@tradevantage/shared";
import { getSession } from "@/lib/auth/session";
import { listBars } from "@/features/chart/queries/bars";
import { toChartBars } from "@/features/chart/lib/bars";

const DAY = 86_400_000;

/** Daily and hourly candles for one market. Hourly reach back to `fromIso` (or 14 days), capped at 700 days. */
export async function journalBars(symbol: string, fromIso?: string): Promise<{ daily: Candle[]; hourly: Candle[] }> {
  if (!(await getSession())) return { daily: [], hourly: [] };
  const now = Date.now();
  const from = Math.max(now - 700 * DAY, Math.min(now - 14 * DAY, fromIso ? Date.parse(fromIso) - DAY : now));
  const [d, h] = await Promise.all([
    listBars({ symbol, interval: "1d", from: new Date(now - 200 * DAY), to: new Date(now) }),
    listBars({ symbol, interval: "1h", from: new Date(from), to: new Date(now) }),
  ]);
  return { daily: toChartBars(d), hourly: toChartBars(h) };
}
