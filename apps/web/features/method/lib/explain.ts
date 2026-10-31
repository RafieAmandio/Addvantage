import type { Level, Signal, Verdict } from "@tradevantage/shared";
import type { ChartLevel, ChartNote } from "@/features/instrument/components/InstrumentChart";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";

/** What the chart draws and the panel says when a level or signal is opened. */
export interface Explainer {
  tf: "1H" | "1D";
  title: string;
  steps: { head: string; body: string }[];
  levels: ChartLevel[];
  notes: ChartNote[];
  focusFrom?: string;
}

const UP = "#00DD94";
const DOWN = "#FF454D";
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

export function explainLevel(l: Level): Explainer {
  const buy = l.side === "buy";
  const name = levelName(l);
  const levels: ChartLevel[] = [{ price: l.price, label: name, kind: "plan" }];
  if (l.stop !== null) levels.push({ price: l.stop, label: "Stop", kind: "stop" });
  if (l.target !== null) levels.push({ price: l.target, label: "FTA", kind: "target" });
  const rLine = l.r !== null ? ` That is ${l.r.toFixed(2)}R: you make ${l.r.toFixed(2)} times what you risk.` : "";
  const exit = `Stop ${l.stop !== null ? p(l.stop) : "not set"}. Target ${l.target !== null ? p(l.target) : "none found"}, the first trouble area (FTA): the nearest ${buy ? "high price has not closed above" : "low price has not closed below"}.${rLine}`;
  const conf = [
    `Daily bias ${l.confluence.d1 ? "agrees" : "does not agree"}`,
    l.confluence.fib !== null ? `a Fib retracement sits at ${p(l.confluence.fib)}` : "no Fib 38.2, 50 or 61.8 within 10% of ATR",
    `the level is ${l.confluence.atr ? "" : "not "}past today's ATR ${buy ? "floor" : "top"}`,
  ].join(", ");

  if (l.type === "inverse") {
    const touchNotes: ChartNote[] = l.touches.map((t, i) => ({ time: t, text: `Touch ${i + 1}`, position: buy ? "aboveBar" : "belowBar", color: "rgba(255,255,255,.7)" }));
    const thrustNote: ChartNote[] = l.thrust ? [{ time: l.thrust.time, text: "Thrust", position: buy ? "belowBar" : "aboveBar", color: buy ? UP : DOWN }] : [];
    return {
      tf: "1H",
      title: `${name} ${p(l.price)}`,
      levels,
      notes: [...touchNotes, ...thrustNote],
      focusFrom: l.touches[0],
      steps: [
        {
          head: `Price ${buy ? "was capped" : "held"} at ${p(l.price)}`,
          body: `${buy ? "Sellers held price under" : "Buyers held price over"} ${p(l.price)} ${l.touches.length === 1 ? "once" : `${l.touches.length} times`} (the "Touch" marks). That makes it ${buy ? "resistance" : "support"}.`,
        },
        {
          head: "Then a candle closed through it",
          body: l.thrust
            ? `The ${wib(l.thrust.time)} candle opened ${buy ? "under" : "over"} the level and closed ${buy ? "above" : "below"} it at ${p(l.thrust.close)}. That is the thrust candle. It traps everyone who ${buy ? "sold" : "bought"} at the level.`
            : "No thrust candle found.",
        },
        {
          head: `${name}: last ${buy ? "high" : "low"} before the break`,
          body: `${p(l.price)} is the last ${buy ? "swing high" : "swing low"} before that break. When price comes back, the trapped ${buy ? "sellers buy" : "buyers sell"} to get out, so old ${buy ? "resistance turns into support" : "support turns into resistance"}. The plan is a ${buy ? "buy limit below" : "sell limit above"} market at ${p(l.price)}.`,
        },
        {
          head: l.naked ? "Still naked" : "Already tested",
          body: l.naked
            ? `Price has not traded back to it since the break, so it is fresh. ${l.space ? "It also moved away first, so a return would be a rounded retest." : "But price has not moved away yet, so wait for space."}`
            : "Price already came back to it once. A tested level is weaker, so the method waits for a candle pattern there instead of a blind limit.",
        },
        { head: "Stop and target", body: `${exit} The stop goes ${buy ? "under" : "over"} the thrust candle, never on the level itself.` },
        {
          head: "Confluence",
          body: `${l.touches.length >= 3 ? "3 or more touches needs no confluence." : `${l.touches.length} touch${l.touches.length === 1 ? "" : "es"} needs ${l.needed}.`} Here: ${conf}.`,
        },
      ],
    };
  }

  const visits = l.touches.length;
  return {
    tf: "1H",
    title: `${name} ${p(l.price)}`,
    levels,
    notes: l.touches.map((t, i) => ({ time: t, text: i === 0 ? "Swing" : `Visit ${i}`, position: buy ? "belowBar" : "aboveBar", color: "rgba(255,255,255,.7)" })),
    focusFrom: l.touches[0],
    steps: [
      { head: `A ${buy ? "low" : "high"} that held at ${p(l.price)}`, body: `Price turned ${buy ? "up" : "down"} here and no candle has closed ${buy ? "below" : "above"} it since.` },
      {
        head: "Same-way level",
        body: `${buy ? "Buying old support" : "Selling old resistance"} goes the same way as the last traders, nobody is trapped yet. So the method needs proof first: an SFP, a wick ${buy ? "under" : "over"} ${p(l.price)} that closes back ${buy ? "above" : "below"} it.`,
      },
      { head: visits >= 3 ? `Visit ${visits}: pass` : visits === 2 ? "Second visit" : "First visit", body: visits >= 3 ? "Three visits wears a level out. Skip it." : visits === 2 ? "Second time back needs an SFP plus MACD divergence." : "First time back needs an SFP." },
      { head: "Stop and target", body: `${exit} The SFP stop sits one 24 hour ATR beyond the level.` },
    ],
  };
}

const SIGNAL_TEXT: Record<Signal["kind"], (s: Signal) => string> = {
  pin: (s) => `A long wick ${s.dir === "bullish" ? "below" : "above"} a small body. Price pushed past the day before, got rejected and closed back inside it.`,
  engulfing: (s) => `This day's body swallowed the whole body of the day before, closing ${s.dir === "bullish" ? "up" : "down"}. One side took control.`,
  idf: (s) => `Mother day, then an inside day within its range, then a day that poked ${s.dir === "bullish" ? "under" : "over"} the inside day and closed back in. The breakout failed.`,
  sfp: (s) => `Price ran the stops ${s.dir === "bullish" ? "under an old swing low" : "over an old swing high"} and closed back. ${s.shallow ? "The swing was too small to count: it needs to be at least 3 daily ATRs deep." : "A deep swing, so it counts."}`,
  cross: () => "Two bias patterns on one candle. The strongest daily read the method has.",
};

export function explainSignal(s: Signal, atrTop: number | null, atrFloor: number | null): Explainer {
  const bull = s.dir === "bullish";
  const refs: ChartNote[] = s.refs.map((t, i) => ({
    time: t,
    text: s.kind === "idf" ? (i === 0 ? "Mother" : "Inside") : s.kind === "sfp" ? "Swing" : "Before",
    position: bull ? "belowBar" : "aboveBar",
    color: "rgba(255,255,255,.7)",
  }));
  const levels: ChartLevel[] = [{ price: s.entry, label: "Entry", kind: "plan" }];
  if (atrTop !== null && atrFloor !== null) levels.push({ price: bull ? atrTop : atrFloor, label: bull ? "ATR top" : "ATR floor", kind: "method" });
  return {
    tf: "1D",
    title: `${s.name} ${wib(s.time, false)}`,
    levels,
    notes: [...refs, { time: s.time, text: s.name, position: bull ? "belowBar" : "aboveBar", color: s.shallow ? "rgba(255,255,255,.5)" : bull ? UP : DOWN }],
    focusFrom: s.refs[0] ?? s.time,
    steps: [
      { head: `What printed: ${s.name.toLowerCase()}`, body: SIGNAL_TEXT[s.kind](s) },
      {
        head: s.shallow ? "Does not set the bias" : `Daily bias: ${bull ? "look for buys" : "look for sells"}`,
        body: s.shallow ? "Treat it as noise for today." : `${s.entryNote} at ${p(s.entry)}. The bias holds for today and counts as one confluence for any hourly ${bull ? "buy" : "sell"} level.`,
      },
    ],
  };
}

export const GLOSSARY: [string, string][] = [
  ["LHPB / LLPB", "Last high (or low) before price broke out. Where price usually comes back to retest."],
  ["Thrust candle", "The candle that opened on one side of a level and closed through it. Stops go behind it."],
  ["Naked", "Broken and not traded back to since. Fresh levels are the strongest."],
  ["Inverse level", "Old resistance now support (or the reverse). Trades against the trapped side."],
  ["Same-way level", "Buying old support again, or selling old resistance. Needs an SFP first."],
  ["SFP", "Swing failure: price takes out an old high or low, then closes back. Stops got run."],
  ["IDF", "Inside day failure: a break of an inside day that closes back inside."],
  ["FTA", "First trouble area: the nearest level against you. That is the target."],
  ["R", "Reward divided by risk. Under 0.5 is a pass, over 1 is an order."],
  ["ATR", "Average daily range over 20 days. Once a day has used 100%, don't chase it."],
];


export const VERDICT: Record<Verdict, { label: string; cls: string }> = {
  order: { label: "Order in", cls: "text-brand" },
  watch: { label: "Watch for PA", cls: "text-white" },
  pass: { label: "Pass", cls: "text-white/40" },
};
