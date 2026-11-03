/**
 * Trade journal: pure maths over trades and candles. No React, no fetching.
 * Prices pass through untouched; only R and percentages get formatted.
 */
import { FOREX_PAIRS, readDaily, readLevels, swings, type Candle, type DailyRead, type Level } from "@tradevantage/shared";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";

export const SIDES = ["buy", "sell"] as const;
export const SETUPS = ["inverse-level", "same-way-level", "sfp", "gap", "gap-sfp", "accumulation", "other"] as const;
export const TIMEFRAMES = ["1H", "1D", "other"] as const;
export const STATUSES = ["planned", "open", "closed", "cancelled"] as const;
export const MISTAKES = ["wrong size", "R under 0.5", "no level", "against daily bias", "traded news", "after cutoff", "exited too early", "moved stop", "revenge trade", "skipped a planned trade"] as const;

export type Side = (typeof SIDES)[number];
export type Setup = (typeof SETUPS)[number];
export type Status = (typeof STATUSES)[number];

export const SETUP_LABEL: Record<Setup, string> = {
  "inverse-level": "Inverse level",
  "same-way-level": "Same-way level",
  sfp: "SFP",
  gap: "Gap",
  "gap-sfp": "Gap SFP",
  accumulation: "Accumulation",
  other: "Other",
};

export interface Trade {
  id: string;
  symbol: string;
  side: Side;
  setup: Setup;
  timeframe: (typeof TIMEFRAMES)[number];
  status: Status;
  entry: number;
  stop: number;
  target: number | null;
  exit: number | null;
  size: number | null;
  riskPct: number;
  openedAt: string;
  closedAt: string | null;
  followedPlan: boolean | null;
  mistakes: string[];
  notes: string;
  screenshotUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TraderSettings {
  equity: number;
  currency: string;
  riskTier: number;
}

/** A rule of the method checked against the plan. `met: null` means there is not enough data to say. */
export interface Rule {
  rule: string;
  met: boolean | null;
  evidence: string;
}

export const MAX_RISK = 2;
const TIER: Record<Setup, number> = { "gap-sfp": 2, "inverse-level": 1.5, "same-way-level": 1.5, sfp: 1.5, gap: 1.5, accumulation: 1.5, other: 1 };
export const riskTier = (s: Setup) => Math.min(TIER[s], MAX_RISK);

const p = fmtPrice;
const r2 = (n: number) => n.toFixed(2);
const H = 3_600_000;

// ── R and size ──────────────────────────────────────────────────────

/** Planned reward to risk: |target - entry| / |entry - stop|. */
export function plannedR(entry: number, stop: number, target: number | null): number | null {
  const risk = Math.abs(entry - stop);
  return target === null || !risk ? null : Math.abs(target - entry) / risk;
}

/** Realised R of a closed trade. (exit - entry) / (entry - stop) is signed right for both sides. */
export function tradeR(t: Pick<Trade, "entry" | "stop" | "exit">): number | null {
  const risk = t.entry - t.stop;
  return t.exit === null || !risk ? null : (t.exit - t.entry) / risk;
}

const INDEX_CCY: Record<string, string> = { SPX: "USD", NDX: "USD", DJI: "USD", DXY: "USD", HG1: "USD", STOXX50E: "EUR", FCHI: "EUR", DAX: "EUR", FTSE: "GBP" };

/** Currencies a symbol trades: both legs of a pair, or the index's home currency. */
export function currencies(symbol: string): string[] {
  const legs = symbol.split("/");
  return legs.length === 2 ? legs : [INDEX_CCY[symbol] ?? symbol];
}

export const isFx = (symbol: string) => FOREX_PAIRS.some((x) => x.symbol === symbol && (x.group === "major" || x.group === "cross"));

export interface Size {
  units: number;
  lots: number | null;
  money: number;
  /** Plain note on how the size was converted, when it is not exact. */
  note: string | null;
}

/** size = equity x risk% / |entry - stop|, converted to account currency where the pair allows it. */
export function positionSize(equity: number, riskPct: number, entry: number, stop: number, symbol: string, currency = "USD"): Size | null {
  const dist = Math.abs(entry - stop);
  if (!dist || !(equity > 0) || !(riskPct > 0)) return null;
  const money = (equity * Math.min(riskPct, MAX_RISK)) / 100;
  const [base, quote] = symbol.split("/");
  let units = money / dist;
  let note: string | null = null;
  if (isFx(symbol)) {
    if (base === currency) units = (money * entry) / dist;
    else if (quote !== currency) note = `Cross pair: size assumes 1 ${quote} = 1 ${currency}, check it with your broker`;
    return { units, lots: units / 100_000, money, note };
  }
  return { units, lots: null, money, note: "Contract size varies by broker, convert units to your broker's contracts" };
}

// ── Check my plan ───────────────────────────────────────────────────

export interface PlanInput {
  symbol: string;
  side: Side;
  setup: Setup;
  entry: number | null;
  stop: number | null;
  target: number | null;
  riskPct: number;
}

export interface Market {
  daily: DailyRead | null;
  levels: Level[];
  price: number | null;
}

export function readMarket(daily: Candle[], hourly: Candle[], now = Date.now()): Market {
  const d = daily.length ? readDaily(daily, now) : null;
  return { daily: d, levels: d && hourly.length ? readLevels(hourly, d, 6) : [], price: hourly.at(-1)?.close ?? daily.at(-1)?.close ?? null };
}

const levelName = (l: Level) => (l.type === "inverse" ? (l.side === "buy" ? "LHPB" : "LLPB") : l.side === "buy" ? "old support" : "old resistance");

export function checkPlan(x: PlanInput, m: Market): Rule[] {
  const buy = x.side === "buy";
  const { entry, stop, target } = x;
  const rules: Rule[] = [];
  const has = entry !== null && stop !== null;

  rules.push({
    rule: "Stop on the right side",
    met: has ? (buy ? stop < entry : stop > entry) : null,
    evidence: !has ? "Enter an entry and a stop" : buy ? (stop < entry ? `Stop ${p(stop)} is under the entry` : `A buy needs the stop under ${p(entry)}`) : stop > entry ? `Stop ${p(stop)} is over the entry` : `A sell needs the stop over ${p(entry)}`,
  });

  const r = has ? plannedR(entry, stop, target) : null;
  rules.push({
    rule: "R at least 0.5",
    met: r === null ? null : r >= 0.5,
    evidence: r === null ? "Add a target to read R" : `${r2(r)}R to ${p(target!)}${r < 1 ? ", ideally above 1" : ""}`,
  });

  const a = m.daily?.atr ?? null;
  if (stop === null || a === null) rules.push({ rule: "Stop clear of other levels", met: null, evidence: a === null ? "No daily candles to read levels from" : "Enter a stop" });
  else {
    const near = m.levels.filter((l) => Math.abs(l.price - stop) <= a * 0.1 && (entry === null || l.price !== entry));
    const closest = [...m.levels].sort((u, v) => Math.abs(u.price - stop) - Math.abs(v.price - stop))[0];
    rules.push({
      rule: "Stop clear of other levels",
      met: near.length === 0,
      evidence: near.length
        ? `Stop sits on the ${levelName(near[0]!)} at ${p(near[0]!.price)}, move it behind the level`
        : closest
          ? `Nearest level ${p(closest.price)} is ${((Math.abs(closest.price - stop) / a) * 100).toFixed(0)}% of the daily ATR away`
          : "No hourly levels near the stop",
    });
  }

  if (entry === null || m.price === null) rules.push({ rule: "Limit on the right side of market", met: null, evidence: m.price === null ? "No market price" : "Enter an entry" });
  else {
    const ok = buy ? entry < m.price : entry > m.price;
    rules.push({
      rule: "Limit on the right side of market",
      met: ok,
      evidence: ok ? `${buy ? "Buy" : "Sell"} limit ${p(entry)} sits ${buy ? "below" : "above"} market ${p(m.price)}` : `Market is ${p(m.price)}, so ${p(entry)} is a stop entry, not a limit`,
    });
  }

  const edge = buy ? m.daily?.atrTop : m.daily?.atrFloor;
  if (entry === null || edge === null || edge === undefined) rules.push({ rule: buy ? "Not buying past the ATR top" : "Not selling past the ATR floor", met: null, evidence: "No ATR read for today" });
  else {
    const ok = buy ? entry <= edge : entry >= edge;
    rules.push({
      rule: buy ? "Not buying past the ATR top" : "Not selling past the ATR floor",
      met: ok,
      evidence: `Today's ATR ${buy ? "top" : "floor"} is ${p(edge)}${ok ? "" : `, the day's range is spent at ${p(entry)}`}`,
    });
  }

  const tier = riskTier(x.setup);
  rules.push({
    rule: "Risk within the tier",
    met: x.riskPct > 0 && x.riskPct <= tier,
    evidence: x.riskPct > MAX_RISK ? `${x.riskPct}% is over the ${MAX_RISK}% hard cap` : `${SETUP_LABEL[x.setup]} risks up to ${tier}%, you have ${x.riskPct}%`,
  });
  return rules;
}

// ── Time in WIB ─────────────────────────────────────────────────────

const WIB = 7 * H;
const wibParts = (ms: number) => new Date(ms + WIB);
export const wibDate = (ms: number) => wibParts(ms).toISOString().slice(0, 10);
export const wibHour = (ms: number) => wibParts(ms).getUTCHours();
/** 0 = Monday. */
export const wibWeekday = (ms: number) => (wibParts(ms).getUTCDay() + 6) % 7;
/** Monday 00:00 WIB of the week `ms` falls in, as epoch ms. */
export function wibWeekStart(ms: number) {
  const d = wibParts(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - wibWeekday(ms) * 24 * H - WIB;
}

// ── Kill list ───────────────────────────────────────────────────────

export interface NewsEvent {
  ts: string;
  title: string;
  currency: string;
  impact: string;
}

export interface Guard {
  /** Reasons "Save as open" is blocked. */
  blocks: Rule[];
  warns: Rule[];
}

const closedByTime = (trades: Trade[]) =>
  trades.filter((t) => t.status === "closed" && t.closedAt && tradeR(t) !== null).sort((u, v) => Date.parse(u.closedAt!) - Date.parse(v.closedAt!));

/** Drawdown in R from the running peak of a sequence of R results (peak starts at 0). */
export function drawdownR(rs: number[]) {
  let eq = 0;
  let peak = 0;
  for (const r of rs) {
    eq += r;
    peak = Math.max(peak, eq);
  }
  return peak - eq;
}

export const SETUP_BREAKER = 10;
export const TOTAL_BREAKER = 20;

export function breakers(trades: Trade[]) {
  const closed = closedByTime(trades);
  const perSetup = SETUPS.map((s) => ({ setup: s, dd: drawdownR(closed.filter((t) => t.setup === s).map((t) => tradeR(t)!)) }));
  return { perSetup, total: drawdownR(closed.map((t) => tradeR(t)!)) };
}

export function killList(x: { symbol: string; side: Side; setup: Setup; trades: Trade[]; events: NewsEvent[]; equity: number; price: number | null; atr: number | null; now?: number; editingId?: string }): Guard {
  const now = x.now ?? Date.now();
  const blocks: Rule[] = [];
  const warns: Rule[] = [];
  const ccys = currencies(x.symbol);
  const others = x.trades.filter((t) => t.id !== x.editingId);

  for (const e of x.events) {
    if (e.impact !== "high" || !ccys.includes(e.currency)) continue;
    const dt = Date.parse(e.ts) - now;
    const mins = Math.round(dt / 60_000);
    if (Math.abs(dt) <= 15 * 60_000) blocks.push({ rule: "High-impact news", met: false, evidence: `${e.title} ${mins >= 0 ? `in ${mins} min` : `${-mins} min ago`}` });
    else if (dt > 0 && dt <= 2 * H) {
      const band = x.price !== null && x.atr !== null ? `, inside ${p(x.price - x.atr / 2)} to ${p(x.price + x.atr / 2)}` : "";
      warns.push({ rule: "News within 2 hours", met: false, evidence: `${e.title} in ${mins} min. Pull resting orders within 50% of ATR of price${band}` });
    }
  }

  if (wibHour(now) >= 23) blocks.push({ rule: "After 23:00 WIB", met: false, evidence: "No new trades after 23:00 WIB" });

  const closed = closedByTime(others);
  const today = closed.filter((t) => wibDate(Date.parse(t.closedAt!)) === wibDate(now));
  const lostPct = today.reduce((s, t) => s + Math.max(0, -tradeR(t)!) * t.riskPct, 0);
  if (lostPct >= 4) blocks.push({ rule: "Daily loss limit", met: false, evidence: `${lostPct.toFixed(2)}% lost today, done for the day` });

  const last4 = closed.slice(-4);
  if (last4.length === 4 && last4.every((t) => tradeR(t)! < 0) && Date.parse(last4[3]!.closedAt!) >= wibWeekStart(now))
    blocks.push({ rule: "4 losses in a row", met: false, evidence: "Stop for the week, back on Monday" });

  if (today.some((t) => t.followedPlan === false)) blocks.push({ rule: "Rule broken today", met: false, evidence: "No trading for the rest of the day" });

  const b = breakers(others);
  if (b.total >= TOTAL_BREAKER) blocks.push({ rule: "Total circuit breaker", met: false, evidence: `${r2(b.total)}R down from the peak, everything halted` });
  const sb = b.perSetup.find((s) => s.setup === x.setup)!;
  if (sb.dd >= SETUP_BREAKER) blocks.push({ rule: `${SETUP_LABEL[x.setup]} halted`, met: false, evidence: `${r2(sb.dd)}R down from its peak` });

  // Exposure: long a pair = long its base, short its quote.
  const exposure = (sym: string, side: Side) => {
    const [base, quote] = sym.split("/");
    const sign = side === "buy" ? 1 : -1;
    return quote ? [[base!, sign] as const, [quote, -sign] as const] : [[sym, sign] as const];
  };
  const mine = exposure(x.symbol, x.side);
  for (const t of others.filter((t) => t.status === "open")) {
    const hit = exposure(t.symbol, t.side).find(([c, s]) => mine.some(([c2, s2]) => c2 === c && s2 === s));
    if (hit) warns.push({ rule: "Correlated exposure", met: false, evidence: `Already ${hit[1] > 0 ? "long" : "short"} ${hit[0]} through ${t.symbol}. Split the risk or take the best one` });
  }
  return { blocks, warns };
}

// ── Open trade manager ──────────────────────────────────────────────

export interface Manage {
  last: number;
  evolvingR: number | null;
  exit: boolean;
  /** Last close is already through the target. */
  past: boolean;
  trail: number | null;
  maeR: number;
}

/** Hourly read of an open trade from the bars since it was opened. */
export function manageTrade(t: Trade, hourly: Candle[]): Manage | null {
  const from = Date.parse(t.openedAt) - H;
  const k0 = hourly.findIndex((b) => Date.parse(b.time) >= from);
  if (k0 < 0) return null;
  const since = hourly.slice(k0);
  const buy = t.side === "buy";
  const last = since.at(-1)!.close;
  const reward = t.target === null ? null : buy ? t.target - last : last - t.target;
  const risk = buy ? last - t.stop : t.stop - last;
  const evolvingR = reward === null || risk <= 0 ? null : Math.max(0, reward) / risk;
  // Trail behind the latest candle since entry that closed through a swing in the trade's direction.
  const { highs, lows } = swings(hourly, 2);
  let trail: number | null = null;
  for (let k = hourly.length - 1; k >= k0 && trail === null; k--) {
    const b = hourly[k]!;
    const prev = hourly[k - 1];
    const crossed = (buy ? highs : lows).some((s) => s < k - 1 && prev && (buy ? prev.close <= hourly[s]!.high && b.close > hourly[s]!.high : prev.close >= hourly[s]!.low && b.close < hourly[s]!.low));
    if (crossed) trail = buy ? b.low : b.high;
  }
  if (trail !== null && (buy ? trail <= t.stop : trail >= t.stop)) trail = null;
  const past = reward !== null && reward <= 0;
  return { last, evolvingR, exit: !past && evolvingR !== null && evolvingR < 0.2, past, trail, maeR: excursion(t, since).mae };
}

/** MAE and MFE in R over these bars. Buy MAE = (entry - min low) / (entry - stop). */
export function excursion(t: Pick<Trade, "side" | "entry" | "stop">, bars: Candle[]) {
  const risk = Math.abs(t.entry - t.stop);
  if (!bars.length || !risk) return { mae: 0, mfe: 0 };
  const lo = Math.min(...bars.map((b) => b.low));
  const hi = Math.max(...bars.map((b) => b.high));
  const buy = t.side === "buy";
  return { mae: Math.max(0, (buy ? t.entry - lo : hi - t.entry) / risk), mfe: Math.max(0, (buy ? hi - t.entry : t.entry - lo) / risk) };
}

const between = (bars: Candle[], from: number, to: number) => bars.filter((b) => Date.parse(b.time) + H > from && Date.parse(b.time) <= to);

export interface Excursion {
  id: string;
  r: number;
  mae: number;
  mfe: number;
  /** Best move in R in the 48 hours after the exit. */
  after: number;
}

export function tradeExcursion(t: Trade, hourly: Candle[]): Excursion | null {
  const r = tradeR(t);
  if (r === null || !t.closedAt) return null;
  const o = Date.parse(t.openedAt);
  const c = Date.parse(t.closedAt);
  const { mae, mfe } = excursion(t, between(hourly, o, c));
  const post = between(hourly, c, c + 48 * H);
  const risk = Math.abs(t.entry - t.stop);
  const buy = t.side === "buy";
  const after = post.length ? Math.max(0, (buy ? Math.max(...post.map((b) => b.high)) - t.exit! : t.exit! - Math.min(...post.map((b) => b.low))) / risk) : 0;
  return { id: t.id, r, mae, mfe, after };
}

export interface MaeFinding {
  maxPct: number;
  stopPct: number;
  kept: number;
  winners: number;
  avgBefore: number;
  avgAfter: number;
  text: string;
}

/**
 * What a tighter stop would have done. The tighter stop sits 5 to 10% past the worst winner's MAE.
 * Each trade is replayed in the new risk unit: stopped (-1R) if its MAE reached the new stop, else R / fraction.
 */
export function maeFinding(xs: Excursion[]): MaeFinding | null {
  const wins = xs.filter((x) => x.r > 0);
  if (wins.length < 3 || xs.length < 4) return null;
  const maxPct = Math.max(...wins.map((w) => w.mae * 100));
  const stopPct = Math.ceil((maxPct + 5) / 5) * 5;
  if (stopPct >= 100) return null;
  const f = stopPct / 100;
  const kept = wins.filter((w) => w.mae < f).length;
  const avgBefore = xs.reduce((s, x) => s + x.r, 0) / xs.length;
  const avgAfter = xs.reduce((s, x) => s + (x.mae >= f ? -1 : x.r / f), 0) / xs.length;
  return {
    maxPct,
    stopPct,
    kept,
    winners: wins.length,
    avgBefore,
    avgAfter,
    text: `Your winners never went more than ${maxPct.toFixed(0)}% of the way to your stop. A stop at ${stopPct}% of the current distance would have kept ${kept} of ${wins.length} winners and ${avgAfter > avgBefore ? "lifted" : "moved"} average R from ${r2(avgBefore)} to ${r2(avgAfter)}.`,
  };
}

// ── Review stats ────────────────────────────────────────────────────

export interface Stats {
  trades: number;
  strike: number;
  avgWin: number | null;
  avgLoss: number | null;
  expectancy: number;
  total: number;
}

export function stats(rs: number[]): Stats {
  const w = rs.filter((r) => r > 0);
  const l = rs.filter((r) => r < 0);
  const total = rs.reduce((s, r) => s + r, 0);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
  return { trades: rs.length, strike: rs.length ? (w.length / rs.length) * 100 : 0, avgWin: avg(w), avgLoss: avg(l), expectancy: rs.length ? total / rs.length : 0, total };
}

/** Closed trades grouped by a key, with stats per group, in the key order given. */
export function groupStats<K extends string | number>(trades: Trade[], key: (t: Trade) => K, order?: readonly K[]) {
  const map = new Map<K, number[]>();
  for (const t of closedByTime(trades)) {
    const k = key(t);
    map.set(k, [...(map.get(k) ?? []), tradeR(t)!]);
  }
  const keys = order ? order.filter((k) => map.has(k)) : [...map.keys()];
  return keys.map((k) => ({ key: k, ...stats(map.get(k)!) }));
}

export const closedTrades = closedByTime;

/** Mistake tags ranked by count. */
export function demonTally(trades: Trade[], since = 0) {
  const n = new Map<string, number>();
  for (const t of trades) if (Date.parse(t.closedAt ?? t.openedAt) >= since) for (const m of t.mistakes) n.set(m, (n.get(m) ?? 0) + 1);
  return [...n.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** One flag per WIB day, oldest first: did any trade that day carry a mistake tag. */
export function demonDays(trades: Trade[], days: number, now = Date.now()) {
  const bad = new Set(trades.filter((t) => t.mistakes.length).map((t) => wibDate(Date.parse(t.closedAt ?? t.openedAt))));
  return Array.from({ length: days }, (_, i) => {
    const date = wibDate(now - (days - 1 - i) * 24 * H);
    return { date, bad: bad.has(date) };
  });
}
