import { marketMap, readDaily, type BoardRow } from "@tradevantage/shared";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";

/** What the last daily close actually shows, to check the trader's morning scan against. */
export interface ScanFacts {
  /** Pattern families printed on the last closed day (empty = nothing). */
  printed: Pattern[];
  /** A weekly or daily swing the close went through, if any. */
  broke: { price: number; up: boolean; weekly: boolean } | null;
  atr: AtrState;
  /** Equal highs or lows nearby: where stops are resting. */
  draw: string | null;
}

export type Pattern = "Hammer" | "Shooting star" | "Engulfing" | "SFP" | "Inside day failure" | "Acc / Dist" | "Nothing";
export const PATTERNS: Pattern[] = ["Hammer", "Shooting star", "Engulfing", "SFP", "Inside day failure", "Acc / Dist", "Nothing"];
export type AtrState = "inside" | "up" | "down";
export const ATR_STATES: { key: AtrState; label: string }[] = [
  { key: "inside", label: "Range not used up" },
  { key: "up", label: "Used up, moving up" },
  { key: "down", label: "Used up, moving down" },
];

const family = (name: string): Pattern | null =>
  name === "Hammer" || name === "Shooting star" || name === "SFP" || name === "Inside day failure"
    ? name
    : name.endsWith("engulfing")
      ? "Engulfing"
      : name === "Accumulation" || name === "Distribution"
        ? "Acc / Dist"
        : null;

export function scanFacts(row: BoardRow): ScanFacts {
  const printed = [...new Set(row.signals.filter((s) => !s.shallow).map((s) => family(s.name)).filter((x): x is Pattern => x !== null))];
  const days = row.days;
  const last = days.at(-1);
  const prev = days.at(-2);
  let broke: ScanFacts["broke"] = null;
  if (last && prev) {
    const m = marketMap(days.slice(0, -1));
    const crossed = (x: number) => (prev.close < x && last.close > x) || (prev.close > x && last.close < x);
    const w = m.weekly.find(crossed);
    const d = m.daily.find(crossed);
    const x = w ?? d;
    if (x !== undefined) broke = { price: x, up: last.close > x, weekly: w !== undefined };
  }
  const read = readDaily(days, last ? Date.parse(last.time) + 2 * 86_400_000 : Date.now());
  const used = read.atr && read.bar ? (read.bar.high - read.bar.low) / read.atr : 0;
  const atr: AtrState = used < 1 || !read.bar ? "inside" : read.bar.close > read.bar.open ? "up" : "down";
  const eq = [...read.equalHighs.map((x) => `equal highs at ${fmtPrice(x)}`), ...read.equalLows.map((x) => `equal lows at ${fmtPrice(x)}`)];
  return { printed, broke, atr, draw: eq[0] ?? null };
}

/** Feedback for each scan answer. Clarity and the draw are the trader's judgement, so they are recorded, not graded. */
export function judgePattern(f: ScanFacts, pick: Pattern): { ok: boolean; text: string } {
  const truth = f.printed.length ? f.printed : (["Nothing"] as Pattern[]);
  const ok = truth.includes(pick);
  return {
    ok,
    text: ok
      ? truth.length > 1
        ? `Yes, and it also printed ${truth.filter((x) => x !== pick).join(" and ").toLowerCase()}.`
        : pick === "Nothing"
          ? "Right, no bias pattern on the last day."
          : `Right, a ${pick.toLowerCase()}.`
      : truth[0] === "Nothing"
        ? "Nothing that counts printed. Pins need the wick past the day before and the close back inside it."
        : `It printed ${truth.join(" and ").toLowerCase()}.`,
  };
}

export function judgeBreak(f: ScanFacts, says: boolean): { ok: boolean; text: string } {
  const did = f.broke !== null;
  return {
    ok: says === did,
    text: f.broke
      ? `The close went ${f.broke.up ? "above" : "below"} the ${f.broke.weekly ? "weekly" : "daily"} swing at ${fmtPrice(f.broke.price)}.`
      : "No weekly or daily swing was closed through.",
  };
}

export function judgeAtr(f: ScanFacts, pick: AtrState): { ok: boolean; text: string } {
  return {
    ok: pick === f.atr,
    text: f.atr === "inside" ? "The day stayed inside its average range." : `The day used its full average range ${f.atr === "up" ? "going up: no chasing buys" : "going down: no chasing sells"}, look for the turn at the next good level.`,
  };
}
