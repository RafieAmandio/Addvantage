import type { Level, Signal, Verdict } from "@tradevantage/shared";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";

/** Step text for a level or signal; the chart reveals one structure per step. */
export interface Explainer {
  title: string;
  steps: { head: string; body: string }[];
}

const p = fmtPrice;

export const wib = (iso: string, withTime = true) =>
  new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Jakarta",
  }) + (withTime ? " WIB" : "");

export const levelName = (l: Level) => (l.type === "inverse" ? (l.side === "buy" ? "LHPB" : "LLPB") : l.side === "buy" ? "Old support" : "Old resistance");

export const VERDICT: Record<Verdict, { label: string; cls: string }> = {
  order: { label: "Meets every rule", cls: "text-brand" },
  watch: { label: "Needs confirmation", cls: "text-white" },
  pass: { label: "Doesn't qualify", cls: "text-white/40" },
};

export function explainLevel(l: Level, bias: Signal["dir"] | null): Explainer {
  const buy = l.side === "buy";
  const name = levelName(l);
  const rLine = l.r !== null ? ` ${l.r.toFixed(2)}R: you make ${l.r.toFixed(2)} times what you risk.` : "";
  const exit = `Stop ${l.stop !== null ? p(l.stop) : "not set"}, target ${l.target !== null ? p(l.target) : "none found"} (the first trouble area, nearest ${buy ? "high" : "low"} against you).${rLine}`;

  if (l.type === "inverse") {
    const conf = [
      bias === null ? "no daily bias" : `daily bias ${l.confluence.d1 ? "agrees" : "disagrees"}`,
      l.confluence.fib !== null ? `Fib at ${p(l.confluence.fib)}` : "no Fib nearby",
      `${l.confluence.atr ? "past" : "inside"} today's ATR ${buy ? "floor" : "top"}`,
    ].join(", ");
    return {
      title: `${name} ${p(l.price)}`,
      steps: [
        { head: "Touches", body: `${buy ? "Sellers capped price at" : "Buyers held price at"} ${p(l.price)} ${l.touches.length === 1 ? "once" : `${l.touches.length} times`}. That made it ${buy ? "resistance" : "support"}.` },
        {
          head: "Thrust",
          body: l.thrust
            ? `The ${wib(l.thrust.time)} candle closed ${buy ? "above" : "below"} it at ${p(l.thrust.close)}. Everyone who ${buy ? "sold" : "bought"} there is now trapped.`
            : "No thrust candle found.",
        },
        { head: name, body: `Last ${buy ? "high" : "low"} before the break. Trapped traders ${buy ? "buy" : "sell"} back here, so old ${buy ? "resistance becomes support" : "support becomes resistance"}. ${buy ? "Buy limit below" : "Sell limit above"} market at ${p(l.price)}.` },
        {
          head: l.naked ? "Naked" : "Tested",
          body: l.naked
            ? `Not traded back to since the break.${l.space ? " Price moved away first, so a return is a rounded retest." : " Price has not moved away yet, wait for space."}`
            : "Price already came back once. Weaker now, wait for a candle pattern instead of a blind limit.",
        },
        { head: "Trade", body: `${exit} Stop sits ${buy ? "under" : "over"} the thrust candle.` },
        { head: "Confluence", body: `${l.touches.length >= 3 ? "3+ touches needs none." : `${l.touches.length} touch${l.touches.length === 1 ? "" : "es"} needs ${l.needed}.`} Here: ${conf}.` },
      ],
    };
  }

  const visits = l.touches.length;
  return {
    title: `${name} ${p(l.price)}`,
    steps: [
      { head: "Swing", body: `Price turned ${buy ? "up" : "down"} at ${p(l.price)} and no candle has closed ${buy ? "below" : "above"} it since.` },
      { head: "Same-way", body: `${buy ? "Buying old support" : "Selling old resistance"} follows the last traders, nobody is trapped. Needs an SFP: a wick ${buy ? "under" : "over"} it that closes back.` },
      { head: visits >= 3 ? "Worn out" : `Visit ${visits}`, body: visits >= 3 ? "Third visit or more. Skip it." : visits === 2 ? "Second time back needs an SFP plus MACD divergence." : "First time back needs an SFP." },
      { head: "Trade", body: `${exit} SFP stop is one 24 hour ATR beyond the level.` },
    ],
  };
}

const SIGNAL_TEXT: Record<Signal["kind"], (s: Signal) => string> = {
  pin: (s) => `Long wick ${s.dir === "bullish" ? "below" : "above"} a small body. Price pushed past the day before, got rejected and closed back inside it.`,
  engulfing: (s) => `This body swallowed the body of the day before, closing ${s.dir === "bullish" ? "up" : "down"}. One side took control.`,
  idf: (s) => `Mother day, an inside day within it, then a poke ${s.dir === "bullish" ? "under" : "over"} the inside day that closed back in. The breakout failed.`,
  sfp: (s) => `Ran the stops ${s.dir === "bullish" ? "under an old swing low" : "over an old swing high"} and closed back. ${s.shallow ? "Swing under 3 daily ATRs deep, so it does not count." : "Deep swing, so it counts."}`,
  cross: () => "Two bias patterns on one candle. The strongest daily read there is.",
  accdist: (s) =>
    s.dir === "bullish"
      ? "Three lower lows, each bought straight back by a green candle, while MACD made higher lows. Sellers are running out."
      : "Three higher highs, each sold straight back by a red candle, while MACD made lower highs. Buyers are running out.",
};

export function explainSignal(s: Signal): Explainer {
  const bull = s.dir === "bullish";
  return {
    title: `${s.name} ${wib(s.time, false)}`,
    steps: [
      { head: "Pattern", body: SIGNAL_TEXT[s.kind](s) },
      { head: s.shallow ? "No bias" : bull ? "Look for buys" : "Look for sells", body: s.shallow ? "Treat it as noise." : `${s.entryNote} at ${p(s.entry)}. Counts as one confluence for any hourly ${bull ? "buy" : "sell"} level today.` },
    ],
  };
}
