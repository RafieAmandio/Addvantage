import type { DailyRead, Level } from "@tradevantage/shared";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import { wib } from "./explain";

/** One rule of the method, checked against this level, with the evidence behind it. */
export interface Rule {
  rule: string;
  met: boolean;
  evidence: string;
}

const p = fmtPrice;

/** The method's checklist for a level. The trader makes the call; this shows which rules hold and why. */
export function checklist(l: Level, d: DailyRead): Rule[] {
  const buy = l.side === "buy";
  const have = Number(l.confluence.d1) + Number(l.confluence.fib !== null) + Number(l.confluence.atr);
  const confluence = [
    l.confluence.d1 && "daily bias",
    l.confluence.fib !== null && `Fib ${p(l.confluence.fib)}`,
    l.confluence.atr && `past the ATR ${buy ? "floor" : "top"}`,
  ].filter(Boolean);
  const spent = d.usedPct !== null && d.usedPct >= 100 && d.today !== null && (buy ? d.today.close > d.today.open : d.today.close < d.today.open);
  const rRule: Rule = {
    rule: l.type === "inverse" ? "R at least 1 for a limit" : "R at least 0.5",
    met: l.r !== null && l.r >= (l.type === "inverse" ? 1 : 0.5),
    evidence: l.r === null ? "No first trouble area found for a target" : `${l.r.toFixed(2)}R to the first trouble area at ${l.target !== null ? p(l.target) : "?"}`,
  };
  const biasRule: Rule = {
    rule: "Not against the daily bias",
    met: d.bias === null || l.confluence.d1,
    evidence: d.bias === null ? "No daily bias today" : `Daily bias is ${d.bias === "bullish" ? "buys" : "sells"}`,
  };
  const atrRule: Rule = {
    rule: "Daily range not spent",
    met: !spent,
    evidence: d.usedPct === null ? "No ATR read" : `${d.usedPct.toFixed(0)}% of the daily ATR used${spent ? ` in the ${buy ? "up" : "down"} direction` : ""}`,
  };

  if (l.type === "same-way") {
    const visits = l.touches.length;
    return [
      { rule: "SFP at the level", met: false, evidence: `Same-way level: wait for a wick ${buy ? "under" : "over"} ${p(l.price)} that closes back` },
      { rule: "Fewer than 3 visits", met: visits < 3, evidence: visits === 1 ? "First time back" : visits === 2 ? "Second visit, also needs MACD divergence" : `Visit ${visits}` },
      biasRule,
      atrRule,
      rRule,
    ];
  }

  return [
    {
      rule: "Clean break",
      met: l.thrust !== null,
      evidence: l.thrust ? `${wib(l.thrust.time)} candle closed ${buy ? "above" : "below"} at ${p(l.thrust.close)}` : "No thrust candle",
    },
    {
      rule: "Enough confluence",
      met: have >= l.needed,
      evidence: `${l.touches.length} touch${l.touches.length === 1 ? "" : "es"} needs ${l.needed}, has ${have}${confluence.length ? `: ${confluence.join(", ")}` : ""}`,
    },
    { rule: "Naked", met: l.naked, evidence: l.naked ? "Not traded back to since the break" : "Price already came back to it" },
    { rule: "Space before the retest", met: l.space, evidence: l.space ? "Price moved away before returning" : "Price has not moved away yet" },
    {
      rule: "Level holding",
      met: !l.weakening,
      evidence: l.weakening ? `Each bounce off it reaches less far than the last. Likely to break, the method exits early here` : "No weakening bounces",
    },
    biasRule,
    atrRule,
    rRule,
  ];
}
