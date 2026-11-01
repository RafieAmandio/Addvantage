import type { Candle, DailyRead, Level, Signal } from "@tradevantage/shared";
import type { Box } from "../components/BoxPrimitive";
import { levelName } from "./explain";

/** Chart labels stay short, like LuxAlgo's BOS/CHoCH tags; the full read is in the panel. */
export const shortName = (l: Level) => (l.type === "inverse" ? levelName(l) : l.side === "buy" ? "Support" : "Resistance");

export type Layer = "atr" | "fib" | "liquidity" | "signals" | "levels" | "sameway" | "passed";

export const LAYERS: { key: Layer; label: string }[] = [
  { key: "levels", label: "LHPB / LLPB" },
  { key: "sameway", label: "Same-way" },
  { key: "passed", label: "Passed levels" },
  { key: "signals", label: "Daily signals" },
  { key: "atr", label: "ATR band" },
  { key: "fib", label: "Fib" },
  { key: "liquidity", label: "Equal highs/lows" },
];

export interface Line {
  price: number;
  color: string;
  style: "solid" | "dashed" | "dotted";
  label: string;
  width?: 1 | 2;
}

export interface Mark {
  time: string;
  text: string;
  above: boolean;
  color: string;
}

export interface Overlays {
  boxes: Box[];
  lines: Line[];
  marks: Mark[];
  /** Bar index to zoom from when something is selected. */
  focus: number | null;
}

export type Pick = { kind: "level"; level: Level } | { kind: "signal"; signal: Signal } | null;

const UP = "#00DD94";
const DOWN = "#FF454D";
const BRAND = "#FFD400";
const sideColor = (buy: boolean) => (buy ? UP : DOWN);
const rgba = (hex: string, a: number) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;

/** Index of the bar a time falls in (last bar at or before it). */
export function indexer(bars: Candle[]) {
  const ts = bars.map((b) => Date.parse(b.time));
  return (iso: string) => {
    const t = Date.parse(iso);
    let i = -1;
    for (let k = 0; k < ts.length && ts[k]! <= t; k++) i = k;
    return i;
  };
}

export function buildOverlays(opts: { tf: "1H" | "1D"; bars: Candle[]; daily: DailyRead; levels: Level[]; layers: Set<Layer>; pick: Pick; step: number }): Overlays {
  const { tf, bars, daily: d, levels, layers, pick, step } = opts;
  const out: Overlays = { boxes: [], lines: [], marks: [], focus: null };
  const last = bars.length - 1;
  if (last < 0) return out;
  const at = indexer(bars);
  const right = last + (tf === "1H" ? 24 : 6);
  const tol = (d.atr ?? 0) * 0.04;
  const on = (l: Layer) => layers.has(l);

  // Context layers stay on under a selection; they are what confluence is checked against.
  if (on("atr") && d.atrTop !== null && d.atrFloor !== null && d.today) {
    const i0 = tf === "1D" ? last : Math.max(0, at(d.today.time));
    out.boxes.push({ i0, i1: right, top: d.atrTop, bottom: d.atrFloor, fill: rgba(BRAND, 0.05), stroke: rgba(BRAND, 0.35), dashed: true, label: `ATR band ${d.usedPct?.toFixed(0) ?? "?"}% used`, labelColor: rgba(BRAND, 0.8) });
  }
  if (on("fib") && d.fib) ["38.2", "50", "61.8"].forEach((n, k) => out.lines.push({ price: d.fib!.levels[k]!, color: "rgba(255,255,255,.35)", style: "dotted", label: `Fib ${n}` }));
  if (on("liquidity")) {
    d.equalHighs.forEach((x) => out.lines.push({ price: x, color: "rgba(255,255,255,.3)", style: "dotted", label: "EQH" }));
    d.equalLows.forEach((x) => out.lines.push({ price: x, color: "rgba(255,255,255,.3)", style: "dotted", label: "EQL" }));
  }

  const touchPrice = (l: Level, t: string) => {
    const b = bars[at(t)];
    if (!b) return l.price;
    return l.type === "inverse" ? (l.side === "buy" ? b.high : b.low) : l.side === "buy" ? b.low : b.high;
  };

  const zone = (l: Level, strong: boolean) => {
    const px = tf === "1H" ? l.touches.map((t) => touchPrice(l, t)) : [];
    const top = Math.max(l.price, ...px) + tol;
    const bottom = Math.min(l.price, ...px) - tol;
    const i0 = tf === "1H" && l.touches[0] ? Math.max(0, at(l.touches[0])) : last - 2;
    const base = l.verdict === "order" ? BRAND : "#FFFFFF";
    const here = l.status === "at-level" && l.type === "inverse";
    out.boxes.push({
      i0,
      i1: right,
      top,
      bottom,
      // Brighter = stronger: touches, confluence and freshness (TrendSpider-style density, one zone at a time).
      fill: rgba(base, strong ? 0.2 : 0.04 + (l.score / 100) * 0.22),
      stroke: strong || here ? rgba(base, here ? 0.9 : 0.6) : undefined,
      dashed: here && !strong,
      label: `${shortName(l)}${here ? " · at level" : ""}${l.verdict === "order" && l.r !== null ? ` · ${l.r.toFixed(2)}R` : ""}`,
      labelColor: l.verdict === "order" ? BRAND : "rgba(255,255,255,.7)",
    });
    out.lines.push({ price: l.price, color: l.verdict === "order" ? BRAND : l.verdict === "watch" ? "rgba(255,255,255,.75)" : "rgba(255,255,255,.3)", style: l.naked ? "solid" : "dashed", label: "", width: strong ? 2 : 1 }); // the zone carries the label
  };

  const tradeBox = (l: Level) => {
    if (l.stop === null) return;
    const i0 = last + 1;
    const i1 = last + (tf === "1H" ? 22 : 6);
    out.boxes.push({ i0, i1, top: Math.max(l.price, l.stop), bottom: Math.min(l.price, l.stop), fill: rgba(DOWN, 0.2), stroke: rgba(DOWN, 0.6), label: "Risk", labelColor: DOWN });
    out.lines.push({ price: l.stop, color: DOWN, style: "solid", label: "Stop" });
    if (l.target !== null) {
      out.boxes.push({ i0, i1, top: Math.max(l.price, l.target), bottom: Math.min(l.price, l.target), fill: rgba(UP, 0.18), stroke: rgba(UP, 0.6), label: l.r !== null ? `${l.r.toFixed(2)}R` : "Target", labelColor: UP });
      out.lines.push({ price: l.target, color: UP, style: "solid", label: "FTA" });
    }
  };

  if (pick?.kind === "level") {
    const l = pick.level;
    const buy = l.side === "buy";
    out.focus = l.touches[0] ? at(l.touches[0]) : null;
    if (l.type === "inverse") {
      // 0 touches, 1 thrust, 2 level, 3 naked/tested, 4 trade, 5 confluence
      l.touches.forEach((t, k) => out.marks.push({ time: t, text: `${k + 1}`, above: buy, color: "rgba(255,255,255,.8)" }));
      if (step === 0) out.boxes.push({ i0: Math.max(0, at(l.touches[0]!)), i1: Math.max(0, at(l.touches.at(-1)!)), top: Math.max(...l.touches.map((t) => touchPrice(l, t))) + tol, bottom: Math.min(...l.touches.map((t) => touchPrice(l, t))) - tol, fill: "rgba(255,255,255,.1)", stroke: "rgba(255,255,255,.5)", label: `${l.touches.length} touches` });
      if (step >= 1 && l.thrust) {
        const ti = at(l.thrust.time);
        out.boxes.push({ i0: ti - 1, i1: ti + 1, top: l.thrust.high, bottom: l.thrust.low, fill: rgba(sideColor(buy), 0.2), stroke: sideColor(buy) });
        out.marks.push({ time: l.thrust.time, text: "Thrust", above: !buy, color: sideColor(buy) });
      }
      if (step >= 2) zone(l, true);
      if (step === 3 && l.thrust) out.boxes.push({ i0: at(l.thrust.time) + 1, i1: last, top: l.price + tol, bottom: l.price - tol, fill: rgba(l.naked ? BRAND : "#FFFFFF", 0.25), label: l.naked ? "Naked since the break" : "Tested", labelColor: l.naked ? BRAND : "rgba(255,255,255,.7)" });
      if (step >= 4) tradeBox(l);
      if (step === 5 && l.confluence.fib !== null) out.lines.push({ price: l.confluence.fib, color: BRAND, style: "dotted", label: "Fib", width: 2 });
    } else {
      l.touches.forEach((t, k) => out.marks.push({ time: t, text: k === 0 ? "Swing" : `Visit ${k}`, above: !buy, color: "rgba(255,255,255,.8)" }));
      if (step >= 1) zone(l, true);
      if (step >= 3) tradeBox(l);
    }
    return out;
  }

  if (pick?.kind === "signal" && tf === "1D") {
    const s = pick.signal;
    const bull = s.dir === "bullish";
    const si = at(s.time);
    const refs = s.refs.map(at).filter((i) => i >= 0);
    const i0 = Math.min(si, ...refs);
    const span = bars.slice(i0, si + 1);
    out.focus = i0;
    out.boxes.push({ i0, i1: si, top: Math.max(...span.map((b) => b.high)), bottom: Math.min(...span.map((b) => b.low)), fill: rgba(sideColor(bull), 0.1), stroke: sideColor(bull), label: s.name, labelColor: sideColor(bull) });
    if (s.kind === "idf" && refs[1] !== undefined) {
      const ins = bars[refs[1]]!;
      out.boxes.push({ i0: refs[1], i1: si, top: ins.high, bottom: ins.low, fill: "rgba(255,255,255,.08)", stroke: "rgba(255,255,255,.5)", dashed: true, label: "Inside day" });
    }
    if (s.kind === "sfp" && refs[0] !== undefined) {
      const sw = bars[refs[0]]!;
      out.lines.push({ price: bull ? sw.low : sw.high, color: "rgba(255,255,255,.6)", style: "dashed", label: "Swing" });
    }
    if (step >= 1 && !s.shallow) out.lines.push({ price: s.entry, color: BRAND, style: "solid", label: "Entry", width: 2 });
    return out;
  }

  if (on("levels") || on("sameway"))
    for (const l of levels) {
      if (l.verdict === "pass" && !on("passed")) continue;
      if (l.type === "inverse" ? on("levels") : on("sameway")) zone(l, false);
    }
  if (on("signals") && tf === "1D")
    for (const s of d.signals) out.marks.push({ time: s.time, text: s.kind === "pin" ? (s.dir === "bullish" ? "Hammer" : "Star") : s.kind === "engulfing" ? "Engulf" : s.kind === "idf" ? "IDF" : s.kind === "cross" ? "Cross" : "SFP", above: s.dir === "bearish", color: s.shallow ? "rgba(255,255,255,.4)" : sideColor(s.dir === "bullish") });
  return out;
}

/** Practice: nothing is drawn until answered, then the trader's tap (white) sits next to the real answer. */
export function practiceOverlays(opts: {
  bars: Candle[];
  daily: DailyRead;
  level: Level;
  answers: { time?: string; price?: number; ok: boolean }[];
}): Overlays {
  const { bars, daily: d, level: l, answers } = opts;
  const out: Overlays = { boxes: [], lines: [], marks: [], focus: null };
  const last = bars.length - 1;
  if (last < 0) return out;
  const at = indexer(bars);
  const buy = l.side === "buy";
  const tol = (d.atr ?? 0) * 0.04;
  // Open the view well before the touches so the answer isn't framed for them.
  out.focus = Math.max(0, (l.touches[0] ? at(l.touches[0]) : last - 120) - 25);
  const n = answers.length;
  const yours = (a: { time?: string; price?: number; ok: boolean }, label: string) => {
    if (a.ok) return;
    if (a.time) out.marks.push({ time: a.time, text: "You", above: buy, color: "rgba(255,255,255,.9)" });
    if (a.price !== undefined) out.lines.push({ price: a.price, color: "rgba(255,255,255,.8)", style: "dashed", label });
  };

  if (n >= 1 && l.thrust) {
    const ti = at(l.thrust.time);
    out.boxes.push({ i0: ti - 1, i1: ti + 1, top: l.thrust.high, bottom: l.thrust.low, fill: rgba(sideColor(buy), 0.2), stroke: sideColor(buy) });
    out.marks.push({ time: l.thrust.time, text: "Break", above: !buy, color: sideColor(buy) });
    yours(answers[0]!, "");
  }
  if (n >= 2) {
    l.touches.forEach((t, k) => out.marks.push({ time: t, text: `${k + 1}`, above: buy, color: "rgba(255,255,255,.8)" }));
    out.lines.push({ price: l.price, color: BRAND, style: "solid", label: shortName(l), width: 2 });
    yours(answers[1]!, "Your pick");
  }
  if (n >= 3 && l.stop !== null) {
    out.lines.push({ price: l.stop, color: DOWN, style: "solid", label: "Stop" });
    yours(answers[2]!, "Your stop");
  }
  if (n >= 4 && l.thrust) out.boxes.push({ i0: at(l.thrust.time) + 1, i1: last, top: l.price + tol, bottom: l.price - tol, fill: rgba(l.naked ? BRAND : "#FFFFFF", 0.25), label: l.naked ? "Naked" : "Tested", labelColor: l.naked ? BRAND : "rgba(255,255,255,.7)" });
  if (n >= 5) {
    const i0 = last + 1;
    const i1 = last + 22;
    if (l.stop !== null) out.boxes.push({ i0, i1, top: Math.max(l.price, l.stop), bottom: Math.min(l.price, l.stop), fill: rgba(DOWN, 0.2), stroke: rgba(DOWN, 0.6), label: "Risk", labelColor: DOWN });
    if (l.target !== null) {
      out.boxes.push({ i0, i1, top: Math.max(l.price, l.target), bottom: Math.min(l.price, l.target), fill: rgba(UP, 0.18), stroke: rgba(UP, 0.6), label: l.r !== null ? `${l.r.toFixed(2)}R` : "Target", labelColor: UP });
      out.lines.push({ price: l.target, color: UP, style: "solid", label: "FTA" });
    }
  }
  return out;
}
