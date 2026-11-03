import type { AtrPair } from "@/features/atr/types";
import { CURRENCIES, type Ccy, type RateOdds } from "../types";

const isCcy = (s: string): s is Ccy => (CURRENCIES as readonly string[]).includes(s);

/**
 * Today's strength per currency: average % move vs the daily open across every
 * scanner pair it appears in (base counts +, quote counts -). Metals and indices skipped.
 */
export function currencyStrength(pairs: AtrPair[]): { ccy: Ccy; score: number; n: number }[] {
  const acc = new Map<Ccy, { sum: number; n: number }>();
  for (const p of pairs) {
    const [base, quote] = p.symbol.split("/");
    if (!base || !quote || !isCcy(base) || !isCcy(quote) || !p.dailyOpen) continue;
    const ch = (((p.price ?? p.dailyClose) - p.dailyOpen) / p.dailyOpen) * 100;
    for (const [c, sign] of [[base, 1], [quote, -1]] as const) {
      const a = acc.get(c) ?? { sum: 0, n: 0 };
      a.sum += sign * ch;
      a.n++;
      acc.set(c, a);
    }
  }
  return [...acc].map(([ccy, a]) => ({ ccy, score: a.sum / a.n, n: a.n })).sort((x, y) => y.score - x.score);
}

/** "25 bps increase" → hike, "No change" → hold, decreases → cut. */
export function moveKind(label: string): "hike" | "cut" | "hold" {
  const l = label.toLowerCase();
  if (l.includes("increase") || l.includes("hike")) return "hike";
  if (l.includes("decrease") || l.includes("cut")) return "cut";
  return "hold";
}

/** Probability of hike / hold / cut summed over outcomes. */
export function oddsSplit(odds: RateOdds) {
  const s = { hike: 0, hold: 0, cut: 0 };
  for (const o of odds.outcomes) s[moveKind(o.label)] += o.p;
  return s;
}

export const pairLegs = (symbol: string): [Ccy, Ccy] | null => {
  const s = symbol.replace("/", "").toUpperCase();
  const a = s.slice(0, 3);
  const b = s.slice(3, 6);
  return s.length === 6 && isCcy(a) && isCcy(b) ? [a, b] : null;
};
