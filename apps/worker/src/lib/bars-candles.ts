import { prisma } from "@tradevantage/db";

/**
 * Candles read from `instrument_bars` (filled by bars-sync from Yahoo), for the symbols
 * TwelveData's plan won't serve. Same shape the TwelveData syncs use, oldest first.
 */
export interface Candle {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

/** Last `limit` bars of one symbol. Daily bars get a plain YYYY-MM-DD date like TwelveData's. */
export async function candlesFromBars(symbol: string, interval: "1h" | "1d", limit: number): Promise<Candle[]> {
  const rows = await prisma.$queryRaw<{ ts: Date; open: number; high: number; low: number; close: number }[]>`
    SELECT ts, open::float8 AS open, high::float8 AS high, low::float8 AS low, close::float8 AS close
    FROM instrument_bars WHERE symbol = ${symbol} AND interval = ${interval}
    ORDER BY ts DESC LIMIT ${limit}`;
  return rows.reverse().map((r) => ({
    // Yahoo stamps some daily bars at 23:00 UTC the day before; +12h lands on the trading day.
    datetime: interval === "1d" ? new Date(r.ts.getTime() + 12 * 3_600_000).toISOString().slice(0, 10) : r.ts.toISOString(),
    open: r.open,
    high: r.high,
    low: r.low,
    close: r.close,
  }));
}

/** Hourly candles merged into 4h candles on the UTC 00/04/08/12/16/20 grid. */
export function to4h(hourly: Candle[]): Candle[] {
  const out: Candle[] = [];
  for (const c of hourly) {
    const t = new Date(c.datetime).getTime();
    const start = new Date(t - (t % (4 * 3_600_000))).toISOString();
    const last = out[out.length - 1];
    if (last && last.datetime === start) {
      last.high = Math.max(last.high, c.high);
      last.low = Math.min(last.low, c.low);
      last.close = c.close;
    } else out.push({ ...c, datetime: start });
  }
  return out;
}

/** Wilder RSI of the closes (oldest first), as TradingView and TwelveData compute it. */
export function rsi(closes: number[], period = 14): number | null {
  if (closes.length <= period) return null;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i]! - closes[i - 1]!;
    if (d > 0) gain += d;
    else loss -= d;
  }
  gain /= period;
  loss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i]! - closes[i - 1]!;
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
  }
  return loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
}
