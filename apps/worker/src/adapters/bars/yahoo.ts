import type { Bar, BarsAdapter, Interval } from "./base";

/**
 * Yahoo Finance chart API (unofficial, keyless). Same tickers the web demo uses.
 * Yahoo has no spot metals: XAU/USD and XAG/USD map to COMEX front-month futures,
 * which sit a few dollars off spot and jump at each roll, so sync-bars keeps the
 * spot metals on TwelveData whenever a key is set.
 */
const TICKERS: Record<string, string> = {
  "XAU/USD": "GC=F",
  "XAG/USD": "SI=F",
  "WTI/USD": "CL=F",
  HG1: "HG=F",
  SPX: "^GSPC",
  NDX: "^NDX",
  DJI: "^DJI",
  DXY: "DX-Y.NYB",
  FTSE: "^FTSE",
  FCHI: "^FCHI",
  DAX: "^GDAXI",
  STOXX50E: "^STOXX50E",
};

/** Yahoo ticker for a canonical symbol, or null when Yahoo has none (e.g. XAU/EUR). */
export function toYahoo(symbol: string): string | null {
  if (TICKERS[symbol]) return TICKERS[symbol];
  if (symbol.startsWith("XAU/") || symbol.startsWith("XAG/")) return null;
  return /^[A-Z]{3}\/[A-Z]{3}$/.test(symbol) ? `${symbol.replace("/", "")}=X` : null;
}

const INTERVALS: Record<Interval, string> = { "1m": "1m", "5m": "5m", "1h": "60m", "1d": "1d" };

/** Yahoo returns float noise (3919.89990234375); keep the decimals the market quotes in. */
const tidy = (v: number) => Number(v.toFixed(v >= 1000 ? 2 : v >= 10 ? 3 : 5));

interface ChartResponse {
  chart?: {
    result?: {
      timestamp?: number[];
      indicators: { quote: { open: (number | null)[]; high: (number | null)[]; low: (number | null)[]; close: (number | null)[]; volume?: (number | null)[] }[] };
    }[];
    error?: { description?: string } | null;
  };
}

// The FX trading day rolls at 17:00 New York (DST aware): shift by 7h so 17:00 NY lands on the next date.
const nyDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" });
const fxDay = (iso: string) => nyDate.format(new Date(Date.parse(iso) + 7 * 3_600_000));

/** Daily FX candles built from hourly ones. Yahoo's own daily FX bars close almost where they open (fake dojis). */
export function fxDailyFromHourly(hourly: Bar[]): Bar[] {
  const days: Bar[] = [];
  let key = "";
  for (const b of hourly) {
    const k = fxDay(b.ts);
    const d = days.at(-1);
    if (k !== key || !d) {
      key = k;
      days.push({ ts: `${k}T00:00:00.000Z`, open: b.open, high: b.high, low: b.low, close: b.close, volume: null });
    } else {
      d.high = Math.max(d.high, b.high);
      d.low = Math.min(d.low, b.low);
      d.close = b.close;
    }
  }
  return days;
}

async function chart(ticker: string, interval: Interval, from: Date, to: Date): Promise<Bar[]> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
    `?period1=${Math.floor(from.getTime() / 1000)}&period2=${Math.floor(to.getTime() / 1000)}&interval=${INTERVALS[interval]}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 TradeVantage" } });
  if (!res.ok) throw new Error(`yahoo ${ticker} ${interval}: HTTP ${res.status}`);
  const body = (await res.json()) as ChartResponse;
  const r = body.chart?.result?.[0];
  if (!r) throw new Error(`yahoo ${ticker} ${interval}: ${body.chart?.error?.description ?? "no result"}`);
  const q = r.indicators.quote[0];
  const ts = r.timestamp ?? [];
  if (!q || ts.length === 0) return [];
  const step = interval === "1h" ? 3600 : interval === "5m" ? 300 : interval === "1m" ? 60 : 0;
  const bars: Bar[] = [];
  ts.forEach((t, i) => {
    const o = q.open[i], h = q.high[i], l = q.low[i], c = q.close[i];
    if (o == null || h == null || l == null || c == null) return; // Yahoo pads closed hours with nulls
    // The live bar is stamped with the last trade time (07:17); off-grid stamps would become stray candles.
    if (step && (t - ts[0]!) % step !== 0) return;
    // Daily bars keep one row per date; the in-progress day can come back with high/low not covering open/close.
    const stamp = step ? new Date(t * 1000).toISOString() : `${new Date(t * 1000).toISOString().slice(0, 10)}T00:00:00.000Z`;
    bars.push({ ts: stamp, open: tidy(o), high: tidy(Math.max(h, o, c)), low: tidy(Math.min(l, o, c)), close: tidy(c), volume: q.volume?.[i] || null });
  });
  return bars;
}

export const yahooAdapter: BarsAdapter = {
  code: "yahoo",
  async fetchBars({ symbol, interval, from, to }) {
    const ticker = toYahoo(symbol);
    if (!ticker) throw new Error(`yahoo: no ticker for ${symbol}`);
    if (interval === "1d" && ticker.endsWith("=X")) {
      // Start a day early so the first trading day is complete.
      const days = fxDailyFromHourly(await chart(ticker, "1h", new Date(from.getTime() - 86_400_000), to));
      return days.filter((d) => d.ts >= `${fxDay(from.toISOString())}T00:00:00.000Z`);
    }
    return chart(ticker, interval, from, to);
  },
};
