import type { Level, Verdict } from "@tradevantage/shared";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import type { Rule } from "./checklist";

const p = fmtPrice;

/** A plain read of one level: what to do, the plan, and the few reasons that matter most. */
export interface Suggestion {
  verdict: Verdict;
  /** "Buy limit 1.33298", "Wait for confirmation", "Stand aside". */
  head: string;
  /** What to wait for, or why to stand aside. */
  note: string | null;
  /** Entry, stop, target and R, shown for anything not ruled out. */
  plan: { label: string; value: string }[];
  why: { text: string; ok: boolean }[];
  met: number;
  total: number;
}

const WAIT: Record<string, (l: Level) => string> = {
  "SFP at the level": (l) => `an SFP at ${p(l.price)}: a wick ${l.side === "buy" ? "under" : "over"} it that closes back`,
  "Not against the daily bias": () => "the daily bias to turn",
  Naked: () => "a candle pattern at the level, it was already tested",
  "Space before the retest": () => "price to move away first, then a rounded retest",
  "R at least 1 for a limit": (l) => `a candle pattern at the level, ${l.r?.toFixed(2) ?? "no"}R is too little for a blind limit`,
  "Enough confluence": () => "more confluence, or a candle pattern at the level",
  "Level holding": () => "a candle pattern, the bounces are getting weaker",
};

/** `call` lets the board pass its own verdict, which also rules out a spent daily range. */
export function suggest(l: Level, rules: Rule[], call?: Verdict): Suggestion {
  const buy = l.side === "buy";
  const unmet = rules.filter((r) => !r.met);
  const spent = unmet.some((r) => r.rule === "Daily range not spent");
  const verdict: Verdict = call ?? (spent ? "pass" : l.verdict);
  const plan = [
    { label: "Stop", value: l.stop !== null ? p(l.stop) : "none" },
    { label: "Target", value: l.target !== null ? p(l.target) : "none" },
    ...(l.r !== null ? [{ label: "R", value: `${l.r.toFixed(2)}R` }] : []),
  ];
  // Rules that fail lead the "why" unless the level is a go; then the strongest support for it.
  const said = rules.filter((r) => r.short !== null);
  const why = (verdict === "order" ? said : [...said.filter((r) => !r.met), ...said.filter((r) => r.met)]).slice(0, 4).map((r) => ({ text: r.short!, ok: r.met }));
  const base = { verdict, why, met: rules.length - unmet.length, total: rules.length };

  if (verdict === "order") return { ...base, head: `${buy ? "Buy" : "Sell"} limit ${p(l.price)}`, note: null, plan };
  if (verdict === "watch") {
    const first = unmet.find((r) => WAIT[r.rule]);
    const wait = first ? WAIT[first.rule]!(l) : "a candle pattern at the level";
    return { ...base, head: "Wait for confirmation", note: `Wait for ${wait}. Then ${buy ? "buy" : "sell"} at ${p(l.price)}.`, plan };
  }
  const reason = spent ? unmet.find((r) => r.rule === "Daily range not spent")!.short : (l.reasons[0] ?? unmet[0]?.short ?? "It does not meet the rules");
  return { ...base, head: "Stand aside", note: reason ? `${reason[0]!.toUpperCase()}${reason.slice(1)}.` : null, plan: [] };
}

/** Strongest level, ranked like the board's boardRow: anything not ruled out, break-and-retest first, at the level, the call, strength. */
export function strongest(levels: Level[]): Level | null {
  const rank: Record<Verdict, number> = { order: 0, watch: 1, pass: 2 };
  return (
    [...levels].sort(
      (x, y) =>
        Number(x.verdict === "pass") - Number(y.verdict === "pass") ||
        Number(y.type === "inverse") - Number(x.type === "inverse") ||
        Number(y.status === "at-level") - Number(x.status === "at-level") ||
        rank[x.verdict] - rank[y.verdict] ||
        y.score - x.score,
    )[0] ?? null
  );
}
