/**
 * Anthony Method: mechanical reads of the daily bias and the hourly levels.
 * Pure functions over candles. Prices are passed through untouched, never rounded.
 */

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type Dir = "bullish" | "bearish";

export interface Signal {
  kind: "pin" | "engulfing" | "sfp" | "idf" | "cross";
  name: string;
  dir: Dir;
  /** Bar the signal printed on. */
  time: string;
  /** Other bars that make the pattern (mother bar, inside bar, swept swing). */
  refs: string[];
  /** Where the method enters off this signal. */
  entry: number;
  entryNote: string;
  /** SFP that swept a swing too shallow to count (under 3x daily ATR). */
  shallow?: boolean;
}

export interface DailyRead {
  atr: number | null;
  /** The bar the bias is read from (last closed daily). */
  bar: Candle | null;
  today: Candle | null;
  signals: Signal[];
  /** Signals on the last closed bar that count toward bias. */
  bias: Dir | null;
  insideDay: { mother: Candle; inside: Candle } | null;
  atrTop: number | null;
  atrFloor: number | null;
  /** Today's range as % of ATR. */
  usedPct: number | null;
  equalHighs: number[];
  equalLows: number[];
  /** Last daily swing leg, for the 38.2 / 50 / 61.8 retracements. */
  fib: { from: number; to: number; levels: number[] } | null;
}

const DAY = 86_400_000;
const body = (b: Candle) => Math.abs(b.close - b.open);
const top = (b: Candle) => Math.max(b.open, b.close);
const bot = (b: Candle) => Math.min(b.open, b.close);

/** ATR seeded with the simple mean, then smoothed exponentially. */
export function atr(bars: Candle[], period = 20): number | null {
  const tr: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const b = bars[i]!;
    const pc = bars[i - 1]!.close;
    tr.push(Math.max(b.high - b.low, Math.abs(b.high - pc), Math.abs(b.low - pc)));
  }
  if (tr.length < period) return null;
  let a = tr.slice(0, period).reduce((s, x) => s + x, 0) / period;
  const k = 2 / (period + 1);
  for (const x of tr.slice(period)) a = (x - a) * k + a;
  return a;
}

/** Fractal swings: high/low beyond `n` bars on each side. */
export function swings(bars: Candle[], n = 2) {
  const highs: number[] = [];
  const lows: number[] = [];
  for (let i = n; i < bars.length - n; i++) {
    let hi = true;
    let lo = true;
    for (let j = 1; j <= n; j++) {
      if (!(bars[i]!.high > bars[i - j]!.high && bars[i]!.high >= bars[i + j]!.high)) hi = false;
      if (!(bars[i]!.low < bars[i - j]!.low && bars[i]!.low <= bars[i + j]!.low)) lo = false;
    }
    if (hi) highs.push(i);
    if (lo) lows.push(i);
  }
  return { highs, lows };
}

function signalsOn(bars: Candle[], i: number, a: number | null): Signal[] {
  const b = bars[i]!;
  const p = bars[i - 1];
  const out: Signal[] = [];
  const range = b.high - b.low;
  // Pin: long wick that probed past the prior candle, small body, close back inside the prior candle.
  const inPrior = p && b.close <= p.high && b.close >= p.low;
  if (range > 0 && inPrior) {
    const up = (b.high - top(b)) / range;
    const dn = (bot(b) - b.low) / range;
    const bd = body(b) / range;
    if (up > 0.6 && bd < 0.3 && b.high > p.high) out.push({ kind: "pin", name: "Shooting star", dir: "bearish", time: b.time, refs: [], entry: b.low, entryNote: "Sell the return to the shooting star low" });
    if (dn > 0.6 && bd < 0.3 && b.low < p.low) out.push({ kind: "pin", name: "Hammer", dir: "bullish", time: b.time, refs: [], entry: b.high, entryNote: "Buy the return to the hammer high" });
  }
  if (p && body(b) > body(p) && top(b) >= top(p) && bot(b) <= bot(p)) {
    if (b.close < b.open) out.push({ kind: "engulfing", name: "Bearish engulfing", dir: "bearish", time: b.time, refs: [p.time], entry: p.high, entryNote: "Sell a pullback to the high of the candle before" });
    if (b.close > b.open) out.push({ kind: "engulfing", name: "Bullish engulfing", dir: "bullish", time: b.time, refs: [p.time], entry: p.low, entryNote: "Buy a pullback to the low of the candle before" });
  }
  // Inside day failure: bar i-2 mother, i-1 inside, i pokes out one side and closes back in.
  const m = bars[i - 2];
  if (m && p && p.high <= m.high && p.low >= m.low) {
    if (b.high > p.high && b.close < p.high) out.push({ kind: "idf", name: "Inside day failure", dir: "bearish", time: b.time, refs: [m.time, p.time], entry: p.high, entryNote: "Sell back at the inside day high" });
    if (b.low < p.low && b.close > p.low) out.push({ kind: "idf", name: "Inside day failure", dir: "bullish", time: b.time, refs: [m.time, p.time], entry: p.low, entryNote: "Buy back at the inside day low" });
  }
  out.push(...sfpOn(bars, i, a, 3));
  if (new Set(out.filter((s) => !s.shallow).map((s) => s.kind)).size >= 2) {
    const dirs = new Set(out.filter((s) => !s.shallow).map((s) => s.dir));
    if (dirs.size === 1) {
      const lead = out.find((s) => !s.shallow)!;
      out.push({ kind: "cross", name: "Cross bar", dir: lead.dir, time: b.time, refs: [], entry: lead.entry, entryNote: "Two bias patterns in one candle" });
    }
  }
  return out;
}

/**
 * SFP on bar i: wicks through an earlier swing and closes back. The swept swing
 * must be unbroken since it formed and at least `depth` x ATR deep on its
 * shorter side, else it is flagged shallow.
 */
export function sfpOn(bars: Candle[], i: number, a: number | null, depth: number): Signal[] {
  const b = bars[i]!;
  const { highs, lows } = swings(bars.slice(0, i), 2);
  const out: Signal[] = [];
  const pick = (idx: number[], hi: boolean) => {
    // Highest swing high (lowest swing low) that bar i swept and that no close has taken out since.
    const hits = idx.filter((s) => {
      const lvl = hi ? bars[s]!.high : bars[s]!.low;
      if (i - s < 3) return false;
      if (hi ? !(b.high > lvl && b.close < lvl) : !(b.low < lvl && b.close > lvl)) return false;
      for (let j = s + 1; j < i; j++) if (hi ? bars[j]!.close > lvl : bars[j]!.close < lvl) return false;
      return true;
    });
    if (!hits.length) return;
    const s = hits.reduce((x, y) => (hi ? bars[y]!.high > bars[x]!.high : bars[y]!.low < bars[x]!.low) ? y : x);
    const lvl = hi ? bars[s]!.high : bars[s]!.low;
    const win = (from: number, to: number) => bars.slice(Math.max(0, from), Math.max(from + 1, to));
    const left = win(s - 10, s);
    const right = win(s + 1, i);
    const side = (xs: Candle[]) => (hi ? lvl - Math.min(...xs.map((x) => x.low)) : Math.max(...xs.map((x) => x.high)) - lvl);
    const shorter = Math.min(side(left), side(right));
    out.push({
      kind: "sfp",
      name: "SFP",
      dir: hi ? "bearish" : "bullish",
      time: b.time,
      refs: [bars[s]!.time],
      entry: b.close,
      entryNote: `${hi ? "Swept the swing high" : "Swept the swing low"} ${lvl} and closed back`,
      shallow: a !== null && shorter < depth * a,
    });
  };
  pick(highs, true);
  pick(lows, false);
  return out;
}

/** Read the daily chart. `now` decides which bar is still forming. */
export function readDaily(all: Candle[], now = Date.now()): DailyRead {
  // Weekend stubs from some feeds are flat candles; they are not trading days.
  const bars = all.filter((b) => b.high > b.low);
  const closed = bars.filter((b) => Date.parse(b.time) + DAY <= now);
  const forming = bars.length > closed.length ? bars.at(-1)! : null;
  const a = atr(closed);
  const i = closed.length - 1;
  const bar = closed[i] ?? null;
  const signals: Signal[] = [];
  // Last 10 closed bars, newest first, for context. Bias only reads the last one.
  for (let k = i; k >= Math.max(2, i - 9); k--) signals.push(...signalsOn(closed, k, a));
  const counted = signals.filter((s) => bar && s.time === bar.time && !s.shallow);
  const dirs = new Set(counted.map((s) => s.dir));
  const bias = dirs.size === 1 ? [...dirs][0]! : null;

  const today = forming ?? bar;
  const p = closed[i - 1];
  const insideDay = bar && p && bar.high <= p.high && bar.low >= p.low ? { mother: p, inside: bar } : null;

  const recent = closed.slice(-15);
  const tol = (a ?? 0) * 0.05;
  const eq = (key: "high" | "low") => {
    const out = new Set<number>();
    for (let x = 0; x < recent.length; x++)
      for (let y = x + 2; y < recent.length; y++)
        if (Math.abs(recent[x]![key] - recent[y]![key]) <= tol) out.add(key === "high" ? Math.max(recent[x]!.high, recent[y]!.high) : Math.min(recent[x]!.low, recent[y]!.low));
    return [...out].sort((m, n) => m - n);
  };

  // Last completed daily leg: most recent swing high and swing low, in time order.
  const sw = swings(closed, 2);
  const h = sw.highs.at(-1);
  const l = sw.lows.at(-1);
  let fib: DailyRead["fib"] = null;
  if (h !== undefined && l !== undefined) {
    const from = h > l ? closed[l]!.low : closed[h]!.high;
    const to = h > l ? closed[h]!.high : closed[l]!.low;
    fib = { from, to, levels: [0.382, 0.5, 0.618].map((r) => to - (to - from) * r) };
  }

  return {
    atr: a,
    bar,
    today,
    signals,
    bias,
    insideDay,
    atrTop: a !== null && today ? today.low + a : null,
    atrFloor: a !== null && today ? today.high - a : null,
    usedPct: a && today ? ((today.high - today.low) / a) * 100 : null,
    equalHighs: eq("high"),
    equalLows: eq("low"),
    fib,
  };
}

export type Verdict = "order" | "watch" | "pass";

export interface Level {
  /** inverse = break and retest of the LHPB/LLPB; same-way = back at old support/resistance. */
  type: "inverse" | "same-way";
  side: "buy" | "sell";
  price: number;
  /** Swing bars that made the level before it broke (inverse) or revisits since (same-way). */
  touches: string[];
  /** Candle that closed through the level (inverse only). */
  thrust: Candle | null;
  /** Never traded back to since the break. */
  naked: boolean;
  /** Price moved away from the level after the break before coming back. */
  space: boolean;
  confluence: { d1: boolean; fib: number | null; atr: boolean };
  needed: number;
  stop: number | null;
  target: number | null;
  r: number | null;
  verdict: Verdict;
  reasons: string[];
}

const NEEDED: Record<number, number> = { 1: 2, 2: 1 };

/**
 * Hourly levels around the current price. Inverse levels come from breaks:
 * the last swing high before a candle closed above it (LHPB, buy the retest),
 * or the last swing low before a close below (LLPB, sell the retest).
 */
export function readLevels(hourly: Candle[], d: DailyRead, max = 3): Level[] {
  const a = d.atr;
  const last = hourly.at(-1);
  if (!a || !last || hourly.length < 20) return [];
  const price = last.close;
  const tol = a * 0.1;
  const h24 = atr(hourly, 24);
  const { highs, lows } = swings(hourly, 2);
  const out: Level[] = [];

  // Nearest swing above/below that no close has taken out since it formed: the first trouble area.
  const unbroken = (idx: number[], hi: boolean) =>
    idx.filter((s) => {
      const lvl = hi ? hourly[s]!.high : hourly[s]!.low;
      return hourly.slice(s + 1).every((b) => (hi ? b.close <= lvl : b.close >= lvl));
    });
  const highsUp = unbroken(highs, true).map((s) => hourly[s]!.high);
  const lowsDn = unbroken(lows, false).map((s) => hourly[s]!.low);

  const level = (side: "buy" | "sell", lvl: number, sIdx: number, t: number, sameKind: number[]) => {
    const buy = side === "buy";
    const thrust = hourly[t]!;
    const after = hourly.slice(t + 1);
    if (after.some((b) => (buy ? b.close < lvl : b.close > lvl))) return; // closed back through: failed
    if (buy ? price <= lvl : price >= lvl) return;
    if (Math.abs(price - lvl) > a) return; // more than a day's range away: not in play today
    const touches = sameKind.filter((s) => s <= sIdx && Math.abs((buy ? hourly[s]!.high : hourly[s]!.low) - lvl) <= tol).map((s) => hourly[s]!.time);
    const naked = after.slice(1).every((b) => (buy ? b.low > lvl : b.high < lvl));
    const far = after.length ? (buy ? Math.max(...after.map((b) => b.high)) - lvl : lvl - Math.min(...after.map((b) => b.low))) : 0;
    // ponytail: "space" is visual in the method; 20% of daily ATR away with 2+ candles is the stand-in.
    const space = after.length >= 2 && far >= a * 0.2;
    // Behind the thrust candle, but never closer than one 24-period hourly ATR: a tighter stop gets puked on noise.
    const behind = buy ? Math.min(thrust.low, hourly[t - 1]?.low ?? thrust.low) : Math.max(thrust.high, hourly[t - 1]?.high ?? thrust.high);
    const floor = h24 ?? 0;
    const stop = buy ? Math.min(behind, lvl - floor) : Math.max(behind, lvl + floor);
    // First trouble area: nearest swing against the trade that formed after the break, or any still unbroken.
    const peak = after.length ? (buy ? Math.max(...after.map((b) => b.high)) : Math.min(...after.map((b) => b.low))) : null;
    const postBreak = (buy ? highs : lows).filter((s) => s > t).map((s) => (buy ? hourly[s]!.high : hourly[s]!.low));
    const fta = [...(buy ? highsUp : lowsDn), ...postBreak, ...(peak !== null ? [peak] : [])].filter((x) => (buy ? x > lvl : x < lvl));
    const target = fta.length ? (buy ? Math.min(...fta) : Math.max(...fta)) : null;
    out.push(grade({ type: "inverse", side, price: lvl, touches, thrust, naked, space, stop, target }, d));
  };

  // Walk every break in the window. One candle can clear several swings; the last one before it is the LHPB/LLPB.
  for (let t = 3; t < hourly.length; t++) {
    const b = hourly[t]!;
    const hs = highs.filter((s) => s < t - 1 && b.open <= hourly[s]!.high && b.close > hourly[s]!.high && hourly.slice(s + 1, t).every((x) => x.close <= hourly[s]!.high));
    if (hs.length) level("buy", hourly[hs.at(-1)!]!.high, hs.at(-1)!, t, highs);
    const ls = lows.filter((s) => s < t - 1 && b.open >= hourly[s]!.low && b.close < hourly[s]!.low && hourly.slice(s + 1, t).every((x) => x.close >= hourly[s]!.low));
    if (ls.length) level("sell", hourly[ls.at(-1)!]!.low, ls.at(-1)!, t, lows);
  }

  // Same-way: nearest unbroken swing low below (old support, buy) and swing high above (old resistance, sell).
  const sameWay = (side: "buy" | "sell") => {
    const buy = side === "buy";
    const idx = unbroken(buy ? lows : highs, !buy).filter((s) => (buy ? hourly[s]!.low < price : hourly[s]!.high > price));
    if (!idx.length) return;
    const s = idx.reduce((x, y) => (Math.abs(hourly[y]![buy ? "low" : "high"] - price) < Math.abs(hourly[x]![buy ? "low" : "high"] - price) ? y : x));
    const lvl = hourly[s]![buy ? "low" : "high"];
    const visits = (buy ? lows : highs).filter((v) => v > s && Math.abs(hourly[v]![buy ? "low" : "high"] - lvl) <= tol).map((v) => hourly[v]!.time);
    const fta = (buy ? highsUp : lowsDn).filter((x) => (buy ? x > price : x < price));
    const target = fta.length ? (buy ? Math.min(...fta) : Math.max(...fta)) : null;
    // SFP stop: one 24-period hourly ATR beyond the level.
    const stop = h24 === null ? null : buy ? lvl - h24 : lvl + h24;
    out.push(grade({ type: "same-way", side, price: lvl, touches: [hourly[s]!.time, ...visits], thrust: null, naked: visits.length === 0, space: true, stop, target }, d));
  };
  sameWay("buy");
  sameWay("sell");

  // Keep the nearest few per side, most actionable first.
  const rank: Record<Verdict, number> = { order: 0, watch: 1, pass: 2 };
  const pickSide = (side: "buy" | "sell") => {
    const seen = new Set<number>();
    return out
      .filter((l) => l.side === side && !seen.has(l.price) && seen.add(l.price))
      .sort((x, y) => Math.abs(x.price - price) - Math.abs(y.price - price))
      .slice(0, max);
  };
  return [...pickSide("buy"), ...pickSide("sell")].sort((x, y) => rank[x.verdict] - rank[y.verdict] || Math.abs(x.price - price) - Math.abs(y.price - price));
}

type Draft = Pick<Level, "type" | "side" | "price" | "touches" | "thrust" | "naked" | "space" | "stop" | "target">;

function grade(l: Draft, d: DailyRead): Level {
  const buy = l.side === "buy";
  const a = d.atr ?? 0;
  const confluence = {
    d1: d.bias === (buy ? "bullish" : "bearish"),
    fib: d.fib?.levels.find((f) => Math.abs(f - l.price) <= a * 0.1) ?? null,
    // Buying at or under today's ATR floor, selling at or over the ATR top.
    atr: buy ? d.atrFloor !== null && l.price <= d.atrFloor : d.atrTop !== null && l.price >= d.atrTop,
  };
  const have = Number(confluence.d1) + Number(confluence.fib !== null) + Number(confluence.atr);
  const risk = l.stop !== null ? Math.abs(l.price - l.stop) : null;
  const r = risk && l.target !== null ? Math.abs(l.target - l.price) / risk : null;
  const reasons: string[] = [];
  let verdict: Verdict;

  if (l.type === "inverse") {
    const needed = l.touches.length >= 3 ? 0 : (NEEDED[l.touches.length] ?? 2);
    if (have < needed) reasons.push(`${l.touches.length} touch${l.touches.length === 1 ? "" : "es"} before the break needs ${needed} confluence, has ${have}`);
    if (!l.space) reasons.push("No space yet after the break, wait for a rounded retest");
    if (!l.naked) reasons.push("Already tested since the break, wait for price action");
    if (r !== null && r < 0.5) reasons.push(`R is ${r.toFixed(2)}, under the 0.5 minimum`);
    if (r === null) reasons.push("No first trouble area found for a target");
    const against = d.bias !== null && !confluence.d1;
    if (against) reasons.push(`Against the daily bias (${d.bias === "bullish" ? "buys" : "sells"}), watch only`);
    verdict = have < needed || (r !== null && r < 0.5) ? "pass" : l.naked && l.space && r !== null && r >= 1 && !against ? "order" : "watch";
    if (verdict === "watch" && r !== null && r < 1 && l.naked && l.space) reasons.push(`R is ${r.toFixed(2)}, order in only above 1`);
    return { ...l, confluence, needed, r, verdict, reasons };
  }

  const visit = l.touches.length; // 1 = first time back
  if (visit >= 3) reasons.push(`Visit ${visit} to this level, pass`);
  else if (visit === 1) reasons.push(`Same-way level, needs an SFP before ${buy ? "buying" : "selling"}`);
  else reasons.push("Second visit, needs an SFP plus MACD divergence");
  if (r !== null && r < 0.5) reasons.push(`R is ${r.toFixed(2)}, under the 0.5 minimum`);
  verdict = visit >= 3 || (r !== null && r < 0.5) ? "pass" : "watch";
  return { ...l, confluence, needed: 0, r, verdict, reasons };
}

export interface BoardRow {
  symbol: string;
  label: string;
  group: string;
  close: number | null;
  asOf: string | null;
  bias: Dir | null;
  /** Signals on the last closed daily bar, shallow SFPs included so the board can say why they don't count. */
  signals: Signal[];
  usedPct: number | null;
  atr: number | null;
  insideDay: boolean;
  /** Most actionable hourly level, if any. */
  level: Level | null;
  /** Board call: order in, watch for PA, or pass, with the reason. */
  call: Verdict;
  why: string;
}

/** One market's line on the board, from its daily and hourly candles. */
export function boardRow(meta: { symbol: string; label: string; group: string }, daily: Candle[], hourly: Candle[], now = Date.now()): BoardRow {
  const d = readDaily(daily, now);
  const levels = readLevels(hourly, d);
  const level = levels.find((l) => l.verdict !== "pass") ?? null;
  const signals = d.signals.filter((s) => s.time === d.bar?.time);
  const close = hourly.at(-1)?.close ?? d.today?.close ?? null;
  let call: Verdict = level?.verdict ?? "pass";
  let why = level ? `${level.side === "buy" ? "Buy" : "Sell"} ${level.type === "inverse" ? (level.side === "buy" ? "LHPB" : "LLPB") : "same-way level"} ${level.price}` : "No hourly level in play";
  // Past the daily ATR in the bias direction: the move is spent, don't chase it.
  if (d.usedPct !== null && d.usedPct >= 100 && level && d.today) {
    const spent = level.side === "buy" ? d.today.close > d.today.open : d.today.close < d.today.open;
    if (spent) {
      call = "pass";
      why = `Daily ATR used ${d.usedPct.toFixed(0)}% in the ${level.side === "buy" ? "up" : "down"} direction`;
    }
  }
  if (!d.atr) {
    call = "pass";
    why = "Not enough daily candles";
  }
  return { ...meta, close, asOf: d.bar?.time ?? null, bias: d.bias, signals, usedPct: d.usedPct, atr: d.atr, insideDay: !!d.insideDay, level, call, why };
}
