// Mock mode only: the ATR scanner, RSI heatmap and gap screener computed from the real
// Yahoo candles listBars already serves in demo. Same formulas as apps/worker.
import { ATR_PERIOD, FOREX_PAIRS, classifyAtrExhaustion, classifyRsi } from "@tradevantage/shared";
import { listBars, type Bar } from "@/features/chart/queries/bars";
import type { AtrPair, AtrScannerData } from "@/features/atr/types";
import type { GapPair, GapScannerData } from "@/features/gap-screener/types";

type Candle = { ts: string; open: number; high: number; low: number; close: number };

const clean = (bars: Bar[]): Candle[] =>
  bars.flatMap((b) => (b.open !== null && b.high !== null && b.low !== null && b.close !== null ? [{ ts: b.ts, open: b.open, high: b.high, low: b.low, close: b.close }] : []));

const DAY = 86_400_000;

async function candles(symbol: string) {
  const now = new Date();
  const [daily, hourly] = await Promise.all([
    listBars({ symbol, interval: "1d", from: new Date(now.getTime() - 120 * DAY), to: now }),
    listBars({ symbol, interval: "1h", from: new Date(now.getTime() - 30 * DAY), to: now }),
  ]);
  // Weekend stubs drag ATR down (apps/worker/src/atr/sync-atr.ts filters them too).
  return {
    daily: clean(daily).filter((c) => ![0, 6].includes(new Date(c.ts).getUTCDay())),
    hourly: clean(hourly),
  };
}

/** Wilder ATR, as apps/worker/src/atr/sync-atr.ts computeAtr. */
function wilderAtr(c: Candle[], period: number): number {
  const trs: number[] = [];
  for (let i = 1; i < c.length; i++) {
    const { high, low } = c[i]!;
    const pc = c[i - 1]!.close;
    trs.push(Math.max(high - low, Math.abs(high - pc), Math.abs(low - pc)));
  }
  let atr = trs.slice(0, period).reduce((s, v) => s + v, 0) / period;
  for (let i = period; i < trs.length; i++) atr = (atr * (period - 1) + trs[i]!) / period;
  return atr;
}

/** Wilder RSI(14) on closes, what TwelveData's /rsi returns. */
export function wilderRsi(closes: number[], period = 14): number | null {
  if (closes.length <= period) return null;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i]! - closes[i - 1]!;
    if (d > 0) gain += d;
    else loss -= d;
  }
  gain /= period;
  loss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i]! - closes[i - 1]!;
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
  }
  return loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
}

/** UTC 4h buckets from hourly candles. */
function to4h(h: Candle[]): Candle[] {
  const out = new Map<number, Candle>();
  for (const c of h) {
    const t = new Date(c.ts).getTime();
    const k = t - (t % (4 * 3600_000));
    const b = out.get(k);
    if (!b) out.set(k, { ...c, ts: new Date(k).toISOString() });
    else Object.assign(b, { high: Math.max(b.high, c.high), low: Math.min(b.low, c.low), close: c.close });
  }
  return [...out.values()];
}

export interface DemoSnapshot {
  symbol: string;
  label: string;
  group: string;
  tier: string;
  atr: AtrPair | null;
  rsi: Record<"1h" | "4h" | "1d", { rsi: number; zone: string; ts: string } | undefined>;
  price: number | null;
  gap: GapPair | null;
}

async function snapshot(p: (typeof FOREX_PAIRS)[number]): Promise<DemoSnapshot> {
  const { daily, hourly } = await candles(p.symbol).catch(() => ({ daily: [] as Candle[], hourly: [] as Candle[] }));
  const last = hourly.at(-1) ?? daily.at(-1);
  const price = last?.close ?? null;

  let atr: AtrPair | null = null;
  const today = daily.at(-1);
  if (today && daily.length >= ATR_PERIOD + 2) {
    const v = wilderAtr(daily, ATR_PERIOD);
    const exhaustionPct = ((today.high - today.low) / v) * 100;
    atr = {
      symbol: p.symbol,
      atr: v,
      price,
      dailyOpen: today.open,
      dailyHigh: today.high,
      dailyLow: today.low,
      dailyClose: today.close,
      upperLevel: today.low + v,
      lowerLevel: today.high - v,
      exhaustionPct,
      direction: today.close >= today.open ? "bullish" : "bearish",
      zone: classifyAtrExhaustion(exhaustionPct),
      group: p.group,
      tier: p.tier,
      ts: today.ts,
    };
  }

  const r = (c: Candle[]) => {
    const v = wilderRsi(c.map((x) => x.close));
    return v === null ? undefined : { rsi: v, zone: classifyRsi(v), ts: c.at(-1)!.ts };
  };

  return {
    symbol: p.symbol,
    label: p.label,
    group: p.group,
    tier: p.tier,
    atr,
    rsi: { "1h": r(hourly), "4h": r(to4h(hourly)), "1d": r(daily) },
    price,
    gap: weekendGap(p, hourly),
  };
}

/** Last weekend gap from hourly candles, as apps/worker/src/gap-screener/sync-gaps.ts. */
function weekendGap(p: (typeof FOREX_PAIRS)[number], h: Candle[]): GapPair | null {
  for (let i = h.length - 1; i > 0; i--) {
    const prev = h[i - 1]!;
    const cur = h[i]!;
    if (new Date(cur.ts).getTime() - new Date(prev.ts).getTime() < 2 * DAY) continue;
    const gapSize = cur.open - prev.close;
    const gapPct = Math.abs(gapSize / prev.close) * 100;
    if (gapPct < 0.3) return null;
    const currentPrice = h.at(-1)!.close;
    const gapDirection = gapSize > 0 ? "UP" : "DOWN";
    const fillAmount = gapDirection === "UP" ? cur.open - currentPrice : currentPrice - cur.open;
    const fillPct = Math.min(100, Math.max(0, (fillAmount / Math.abs(gapSize)) * 100));
    const days = (Date.now() - new Date(cur.ts).getTime()) / DAY;
    const status = fillPct >= 100 ? "filled" : days > 4 ? "expired" : "active";
    if (status === "expired") return null;
    return {
      symbol: p.symbol,
      group: p.group,
      tier: p.tier,
      fridayClose: prev.close,
      mondayOpen: cur.open,
      currentPrice,
      gapPct,
      gapDirection,
      fillPct,
      status,
      setup: gapDirection === "UP" ? "SELL" : "BUY",
      rr: Math.round((1 / 1.5) * 100) / 100,
      weekStart: cur.ts.slice(0, 10),
      ts: h.at(-1)!.ts,
    };
  }
  return null;
}

// One scan per process every 5 minutes; Yahoo responses are fetch-cached under that too.
let memo: { at: number; data: Promise<DemoSnapshot[]> } | null = null;
export function demoMarket(): Promise<DemoSnapshot[]> {
  if (!memo || Date.now() - memo.at > 300_000) {
    memo = { at: Date.now(), data: Promise.all(FOREX_PAIRS.map(snapshot)) };
  }
  return memo.data;
}

export async function demoAtrScanner(): Promise<AtrScannerData> {
  const pairs = (await demoMarket()).flatMap((s) => (s.atr ? [s.atr] : []));
  pairs.sort((a, b) => b.exhaustionPct - a.exhaustionPct);
  return { updatedAt: new Date(memo?.at ?? Date.now()).toISOString(), pairs };
}

export async function demoGapScanner(): Promise<GapScannerData> {
  const pairs = (await demoMarket()).flatMap((s) => (s.gap ? [s.gap] : []));
  pairs.sort((a, b) => b.gapPct - a.gapPct);
  return { updatedAt: new Date(memo?.at ?? Date.now()).toISOString(), pairs };
}
