import { readDaily, readLevels, type Candle, type DailyRead, type Level } from "@tradevantage/shared";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import { indexer } from "./overlays";

/**
 * Practice mode: the trader finds the structure on a real chart and the read
 * from the candles grades each answer. Questions run in order on one level.
 */
export type Question = "thrust" | "level" | "stop" | "naked" | "qualifies";
export const QUESTIONS: { key: Question; ask: (l: Level) => string; tap?: "candle" | "price" }[] = [
  { key: "thrust", ask: (l) => `Tap the candle that broke ${l.side === "buy" ? "up through resistance" : "down through support"}.`, tap: "candle" },
  { key: "level", ask: (l) => `Tap the price of the ${l.side === "buy" ? "LHPB, the last high" : "LLPB, the last low"} before that break.`, tap: "price" },
  { key: "stop", ask: (l) => `If you ${l.side === "buy" ? "buy" : "sell"} the retest, tap where the stop goes.`, tap: "price" },
  { key: "naked", ask: () => "Has price come back to the level since the break?" },
  { key: "qualifies", ask: () => "Does this level qualify for a limit order?" },
];

export interface Answer {
  ok: boolean;
  /** What the trader tapped or picked, for drawing it next to the real answer. */
  time?: string;
  price?: number;
  choice?: boolean;
  feedback: string;
}

const p = fmtPrice;

export function gradeThrust(l: Level, bars: Candle[], time: string): Answer {
  const at = indexer(bars);
  const want = l.thrust ? at(l.thrust.time) : -1;
  const got = at(time);
  const off = got - want;
  if (off === 0) return { ok: true, time, feedback: `Yes. That candle opened ${l.side === "buy" ? "under" : "over"} ${p(l.price)} and closed through it at ${p(l.thrust!.close)}.` };
  if (Math.abs(off) === 1) return { ok: false, time, feedback: `One candle ${off < 0 ? "early" : "late"}. The break is the candle that closes through the level, not the one ${off < 0 ? "before" : "after"} it.` };
  return {
    ok: false,
    time,
    feedback:
      off < 0
        ? `Too early. The break comes later: look for a strong candle that closes ${l.side === "buy" ? "above a high" : "below a low"} price had failed at more than once.`
        : "Too late. The move was already under way by then. Go back to the first candle that closed through the level.",
  };
}

export function gradeLevel(l: Level, bars: Candle[], price: number, d: DailyRead): Answer {
  const tol = (d.atr ?? 0) * 0.1;
  const buy = l.side === "buy";
  const diff = price - l.price;
  if (Math.abs(diff) <= tol) return { ok: true, price, feedback: `Yes, ${p(l.price)}. That swing ${buy ? "high" : "low"} was the last one before the break, touched ${l.touches.length} time${l.touches.length === 1 ? "" : "s"}.` };
  const t = l.thrust;
  if (t && Math.abs(price - (buy ? t.high : t.low)) <= tol)
    return { ok: false, price, feedback: `That is the ${buy ? "high" : "low"} of the breakout candle itself. The LHPB is the last ${buy ? "high" : "low"} before it: ${p(l.price)}.` };
  if (t && Math.abs(price - t.close) <= tol) return { ok: false, price, feedback: `That is where the breakout candle closed. The level is the swing it broke: ${p(l.price)}.` };
  const past = buy ? diff > 0 : diff < 0;
  return {
    ok: false,
    price,
    feedback: `${past ? "Past" : "Short of"} it by ${p(Math.abs(diff))}. Look left of the breakout candle for the last swing ${buy ? "high" : "low"} price failed at: ${p(l.price)}.`,
  };
}

export function gradeStop(l: Level, price: number, d: DailyRead): Answer {
  const buy = l.side === "buy";
  const tol = (d.atr ?? 0) * 0.1;
  const t = l.thrust;
  const stop = l.stop;
  if (stop === null || !t) return { ok: true, price, feedback: "No stop to compare against on this level." };
  if (buy ? price >= l.price : price <= l.price) return { ok: false, price, feedback: `A ${buy ? "buy" : "sell"} stop has to be ${buy ? "below" : "above"} the entry at ${p(l.price)}.` };
  const extreme = buy ? t.low : t.high;
  if (buy ? price > extreme + tol : price < extreme - tol)
    return { ok: false, price, feedback: `Too tight. That is inside the breakout candle, a normal retest takes you out. Go ${buy ? "under its low" : "over its high"}, ${p(stop)} here.` };
  if (Math.abs(price - stop) <= tol || (buy ? price <= extreme + tol && price >= stop - tol : price >= extreme - tol && price <= stop + tol))
    return { ok: true, price, feedback: `Yes. Behind the breakout candle, ${p(stop)}. Never on the level itself.` };
  const r = l.target !== null ? Math.abs(l.target - l.price) / Math.abs(l.price - price) : null;
  return { ok: false, price, feedback: `Wider than it needs to be${r !== null ? `, R drops to ${r.toFixed(2)}` : ""}. Behind the breakout candle is enough: ${p(stop)}.` };
}

export function gradeNaked(l: Level, saysCame: boolean): Answer {
  const came = !l.naked;
  return {
    ok: saysCame === came,
    choice: saysCame,
    feedback: came ? "It has. Price traded back to the level, so it is tested and weaker: wait for a candle pattern there." : "It has not. The level is naked, the strongest kind, and a limit order can sit on it.",
  };
}

export function gradeQualifies(l: Level, says: boolean, failing: string[]): Answer {
  const does = failing.length === 0;
  return {
    ok: says === does,
    choice: says,
    // Lowercase the rule names mid-sentence, except "R" which is a unit.
    feedback: does
      ? "It does. The setup qualifies, so a limit order is allowed. Sizing is still your call."
      : `It does not. Failing: ${failing.map((r) => (r.startsWith("R ") ? r : r[0]!.toLowerCase() + r.slice(1))).join(", ")}.`,
  };
}

/** A past moment to practise on: the chart is cut at `cut`, the level was live then, and we know what happened after. */
export interface Drill {
  level: Level;
  daily: DailyRead;
  /** Hourly window shown during the drill: [from, cut). */
  from: number;
  cut: number;
  outcome: Outcome;
}

export interface Outcome {
  kind: "win" | "loss" | "no-fill" | "running";
  fillTime: string | null;
  exitTime: string | null;
  r: number | null;
}

const DAY = 86_400_000;

/** What the level did after the cut: filled or not, then target or stop first (same candle counts as the stop). */
export function outcome(l: Level, after: Candle[]): Outcome {
  const buy = l.side === "buy";
  const fill = after.findIndex((b) => (buy ? b.low <= l.price : b.high >= l.price));
  if (fill < 0) return { kind: "no-fill", fillTime: null, exitTime: null, r: null };
  for (let j = fill; j < after.length; j++) {
    const b = after[j]!;
    if (l.stop !== null && (buy ? b.low <= l.stop : b.high >= l.stop)) return { kind: "loss", fillTime: after[fill]!.time, exitTime: b.time, r: -1 };
    if (l.target !== null && (buy ? b.high >= l.target : b.low <= l.target)) return { kind: "win", fillTime: after[fill]!.time, exitTime: b.time, r: l.r };
  }
  return { kind: "running", fillTime: after[fill]!.time, exitTime: null, r: null };
}

/**
 * Walk back through the hourly history a day at a time and collect every fresh
 * break-and-retest level as it first appeared. The daily read only sees closed
 * days plus the part of the current day before the cut, so nothing leaks from the future.
 */
export function buildDrills(hourly: Candle[], daily: Candle[], days = 40): Drill[] {
  const found = new Map<string, Drill>();
  for (let cut = hourly.length; cut >= Math.max(200, hourly.length - days * 24); cut -= 24) {
    const at = Date.parse(hourly[cut - 1]!.time);
    const dayStart = Math.floor(at / DAY) * DAY;
    const closed = daily.filter((b) => Date.parse(b.time) + DAY <= at + 3_600_000);
    const today = hourly.slice(0, cut).filter((b) => Date.parse(b.time) >= dayStart);
    const forming = today.length
      ? [{ time: new Date(dayStart).toISOString(), open: today[0]!.open, high: Math.max(...today.map((b) => b.high)), low: Math.min(...today.map((b) => b.low)), close: today.at(-1)!.close }]
      : [];
    const d = readDaily([...closed, ...forming], at + 1);
    const from = Math.max(0, cut - 480);
    for (const l of readLevels(hourly.slice(from, cut), d)) {
      if (l.type !== "inverse" || !l.thrust || !l.naked) continue;
      // Iterating backwards, so the last write is the earliest moment the level was readable.
      found.set(`${l.price}|${l.thrust.time}`, { level: l, daily: d, from, cut, outcome: outcome(l, hourly.slice(cut)) });
    }
  }
  // Oldest first; today's live level (if any) comes last.
  return [...found.values()].sort((a, b) => a.cut - b.cut);
}
