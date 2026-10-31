import { cache } from "react";
import { z } from "zod";
import { isMockMode } from "@/lib/config/public";
import { apiGet } from "@/lib/api/client-server";

export const BarSchema = z.object({
  ts: z.string(),
  open: z.number().nullable(),
  high: z.number().nullable(),
  low: z.number().nullable(),
  close: z.number().nullable(),
  volume: z.number().nullable(),
});
export type Bar = z.infer<typeof BarSchema>;

interface ListBarsInput {
  symbol: string;
  interval: "1m" | "5m" | "1h" | "1d";
  from: Date;
  to: Date;
  limit?: number;
}

// Mock mode only: real candles from Yahoo so the method tools read real structure, not noise.
const YAHOO: Record<string, string> = { "XAU/USD": "GC=F", "XAG/USD": "SI=F", "WTI/USD": "CL=F", HG1: "HG=F", SPX: "^GSPC", NDX: "^NDX", DJI: "^DJI", DXY: "DX-Y.NYB", FTSE: "^FTSE", FCHI: "^FCHI", DAX: "^GDAXI", STOXX50E: "^STOXX50E" };

async function yahooBars({ symbol, interval, from }: ListBarsInput): Promise<Bar[]> {
  const ticker = YAHOO[symbol] ?? (/^[A-Z]{3}\/[A-Z]{3}$/.test(symbol) ? `${symbol.replace("/", "")}=X` : null);
  if (!ticker || (interval !== "1h" && interval !== "1d")) return [];
  const days = Math.ceil((Date.now() - from.getTime()) / 86_400_000);
  const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${Math.min(days, 700)}d&interval=${interval}`, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 900 } });
  if (!res.ok) return [];
  type Q = { open: (number | null)[]; high: (number | null)[]; low: (number | null)[]; close: (number | null)[] };
  const r = ((await res.json()) as { chart: { result?: { timestamp?: number[]; indicators: { quote: Q[] } }[] } }).chart.result?.[0];
  const q = r?.indicators.quote[0];
  if (!r?.timestamp || !q) return [];
  return r.timestamp.map((t, i) => ({ ts: new Date(t * 1000).toISOString(), open: q.open[i] ?? null, high: q.high[i] ?? null, low: q.low[i] ?? null, close: q.close[i] ?? null, volume: null }));
}

export const listBars = cache(async (input: ListBarsInput): Promise<Bar[]> => {
  if (isMockMode()) return yahooBars(input).catch(() => []);
  try {
    const qs = new URLSearchParams({
      symbol: input.symbol,
      interval: input.interval,
      from: input.from.toISOString(),
      to: input.to.toISOString(),
    });
    if (input.limit) qs.set("limit", String(input.limit));
    const data = await apiGet<{ bars: Bar[] }>(`/bars?${qs.toString()}`);
    return (data as unknown as { bars: Bar[] }).bars ?? [];
  } catch {
    return [];
  }
});
