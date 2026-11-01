import { FOREX_PAIRS, boardRow, type BoardRow, type Candle } from "@tradevantage/shared";
import { readMarket, type Market } from "@/features/journal/lib/journal";
import { scanFacts, type ScanFacts } from "@/features/method/lib/scan";
import raw from "./sample-candles.json";

/**
 * Real candles saved once for the landing page, so the product components on it
 * run the same reads as the app without a live feed. Rows are [unix s, o, h, l, c].
 */
type Row = [number, number, number, number, number];
const data = raw as unknown as Record<string, { daily: Row[]; hourly: Row[] }>;

const toCandles = (rows: Row[]): Candle[] => rows.map(([t, open, high, low, close]) => ({ time: new Date(t * 1000).toISOString(), open, high, low, close }));
const meta = (symbol: string) => {
  const p = FOREX_PAIRS.find((x) => x.symbol === symbol);
  return { symbol, label: p?.label ?? symbol, group: p?.group ?? "other" };
};

/** The snapshot's clock: a day after the last daily candle opened, so the last close counts, as it does in the app over a weekend. */
export const SAMPLE_NOW = Math.max(...Object.values(data).map((d) => d.daily.at(-1)![0])) * 1000 + 86_400_000;

const row = (symbol: string): BoardRow => {
  const d = data[symbol]!;
  return boardRow(meta(symbol), toCandles(d.daily), toCandles(d.hourly).slice(-480), SAMPLE_NOW);
};

/** Every saved market's board line, in the file's order. */
export const allRows = () => Object.keys(data).map(row);

/** Raw hourly and daily candles for one market. */
export const candles = (symbol: string) => ({ hourly: toCandles(data[symbol]!.hourly), daily: toCandles(data[symbol]!.daily) });

/** Hero: the full Chart Lab on the one market saved with 60 days of hourly history, for practice replays. */
export function heroSample() {
  const symbol = Object.keys(data).sort((a, b) => data[b]!.hourly.length - data[a]!.hourly.length)[0]!;
  const d = data[symbol]!;
  return { symbol, hourly: d.hourly, daily: d.daily, row: row(symbol) };
}

/** The board, in the order the Chart Lab ranks it. */
export function boardSample(): BoardRow[] {
  const rank = { order: 0, watch: 1, pass: 2 } as const;
  return Object.keys(data)
    .map(row)
    .filter((r) => r.level && r.call !== "pass")
    .sort((a, b) => rank[a.call] - rank[b.call] || b.level!.score - a.level!.score);
}

/** Morning scan: one market's last 40 days and what its last close actually printed. */
export function scanSample(symbol = "EUR/USD"): { row: BoardRow; facts: ScanFacts } {
  const r = row(symbol);
  return { row: r, facts: scanFacts(r) };
}

/** Plan checker: the market read the journal checks a plan against. */
export function planSample(symbol = "USD/JPY"): { symbol: string; market: Market; row: BoardRow } {
  const d = data[symbol]!;
  return { symbol, market: readMarket(toCandles(d.daily), toCandles(d.hourly), SAMPLE_NOW), row: row(symbol) };
}
