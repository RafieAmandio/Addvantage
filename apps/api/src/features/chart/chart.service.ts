import { z } from "zod";
import { env } from "@/config/env.js";
import { chartRepository } from "./chart.repository.js";

const DEFAULT_LIMIT = 5000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface ListBarsOpts {
  symbol: string;
  interval: string;
  from?: Date;
  to?: Date;
  limit?: number;
}

const TD_BASE = "https://api.twelvedata.com";
const TD_INTERVAL: Record<string, string> = {
  "1m": "1min", "5m": "5min", "1h": "1h", "1d": "1day",
};

const TdValue = z.object({
  datetime: z.string().min(1),
  open: z.string(), high: z.string(), low: z.string(), close: z.string(),
  volume: z.string().optional(),
});
const TdOk = z.object({ status: z.literal("ok"), values: z.array(TdValue) });
const TdErr = z.object({ status: z.literal("error"), message: z.string() });
const TdResponse = z.union([TdOk, TdErr]);

function tdIso(dt: string): string {
  const withT = dt.includes(" ") ? dt.replace(" ", "T") : dt;
  return (withT.length === 10 ? `${withT}T00:00:00` : withT) + "Z";
}

async function fetchTwelveData(symbol: string, interval: string, from: Date, to: Date) {
  const apiKey = env.MARKET_DATA_API_KEY;
  if (!apiKey) return null;
  const tdInt = TD_INTERVAL[interval];
  if (!tdInt) return null;

  const fmt = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");
  const qs = new URLSearchParams({
    symbol, interval: tdInt,
    start_date: fmt(from), end_date: fmt(to),
    apikey: apiKey, format: "JSON", timezone: "UTC",
  });

  try {
    const res = await fetch(`${TD_BASE}/time_series?${qs}`);
    if (!res.ok) return null;
    const parsed = TdResponse.safeParse(await res.json());
    if (!parsed.success || parsed.data.status === "error") return null;

    return parsed.data.values
      .map(v => ({
        ts: tdIso(v.datetime),
        open: Number(v.open), high: Number(v.high),
        low: Number(v.low), close: Number(v.close),
        volume: v.volume && v.volume !== "" ? Number(v.volume) : null,
      }))
      .sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
  } catch {
    return null;
  }
}

export const chartService = {
  async listBars(opts: ListBarsOpts) {
    const to = opts.to ?? new Date();
    const from = opts.from ?? new Date(to.getTime() - THIRTY_DAYS_MS);
    const limit = opts.limit ?? DEFAULT_LIMIT;

    const rows = await chartRepository.listBars({ symbol: opts.symbol, interval: opts.interval, from, to, limit });

    let bars = rows.map((r) => ({
      ts: r.ts.toISOString(),
      open: r.open !== null ? Number(r.open) : null,
      high: r.high !== null ? Number(r.high) : null,
      low: r.low !== null ? Number(r.low) : null,
      close: r.close !== null ? Number(r.close) : null,
      volume: r.volume !== null ? Number(r.volume) : null,
    }));

    if (bars.length === 0) {
      const tdBars = await fetchTwelveData(opts.symbol, opts.interval, from, to);
      if (tdBars) bars = tdBars;
    }

    return {
      symbol: opts.symbol,
      interval: opts.interval,
      from: from.toISOString(),
      to: to.toISOString(),
      bars,
    };
  },
};
