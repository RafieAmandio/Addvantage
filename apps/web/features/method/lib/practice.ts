import type { Candle, DailyRead, Level } from "@tradevantage/shared";
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
  { key: "qualifies", ask: () => "Does this level meet every rule for a limit order?" },
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
    feedback: does ? "It does. Every rule holds, so a limit order is allowed. Sizing is still your call." : `It does not. Failing: ${failing.join(", ").toLowerCase()}.`,
  };
}
