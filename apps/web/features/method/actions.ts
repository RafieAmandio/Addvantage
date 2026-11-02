"use server";

import { FOREX_PAIRS, type Candle } from "@tradevantage/shared";
import { getSession } from "@/lib/auth/session";
import { listBars } from "@/features/chart/queries/bars";
import { toChartBars } from "@/features/chart/lib/bars";

const DAY = 86_400_000;
const flat = (s: string) => s.replace("/", "").toUpperCase();

/** Candles for the Chart Lab workspace, so switching markets swaps the chart in place. */
export async function loadMarket(symbol: string): Promise<{ hourly: Candle[]; daily: Candle[] } | null> {
  // Only markets the board knows; this runs on whatever the client sends.
  const pair = FOREX_PAIRS.find((p) => flat(p.symbol) === flat(String(symbol)));
  if (!pair || !(await getSession())) return null;
  const now = Date.now();
  const [h, d] = await Promise.all([
    // 60 days of hourly history so practice can replay past breaks.
    listBars({ symbol: pair.symbol, interval: "1h", from: new Date(now - 60 * DAY), to: new Date(now) }),
    listBars({ symbol: pair.symbol, interval: "1d", from: new Date(now - 200 * DAY), to: new Date(now) }),
  ]);
  return { hourly: toChartBars(h), daily: toChartBars(d) };
}
