/**
 * Demo mode only: a believable journal history built from real hourly candles at seed time,
 * so dates stay recent whenever it is seeded and MAE/MFE read the same bars the review loads.
 * Each spec picks the side (and, if needed, a later bar) whose real path gives the wanted result.
 */
import type { Candle } from "@tradevantage/shared";
import { journalBars } from "./actions";
import { MAX_RISK, riskTier, wibDate, wibHour, wibWeekday, type Setup, type Trade } from "./lib/journal";

type Want = "win" | "loss" | "early" | "bigloss" | "open";
interface Spec {
  /** Trading days back from the latest one with candles. */
  d: number;
  /** WIB hour, or "next" for the hour after the previous trade closed. */
  h: number | "next";
  sym: string;
  setup: Setup;
  want: Want;
  mistakes?: string[];
  risk?: number;
  /** Stop distance in average hourly ranges (default 2.2); tight stops close fast. */
  rm?: number;
  note: string;
}

const SPECS: Spec[] = [
  { d: 29, h: 14, sym: "EUR/USD", setup: "inverse-level", want: "win", note: "London open retest of the old resistance, clean rejection." },
  { d: 28, h: 20, sym: "XAU/USD", setup: "sfp", want: "win", note: "Swept the Asia high into NY, closed back inside." },
  { d: 27, h: 9, sym: "USD/JPY", setup: "same-way-level", want: "loss", note: "Level held for an hour then gave way." },
  { d: 26, h: 15, sym: "GBP/USD", setup: "gap", want: "win", note: "Gap from the Monday open filled by London lunch." },
  { d: 25, h: 21, sym: "XAU/USD", setup: "inverse-level", want: "loss", mistakes: ["no level"], note: "Took it off a round number, not a real level." },
  { d: 23, h: 14, sym: "EUR/USD", setup: "same-way-level", want: "loss", note: "Stopped on the first push." },
  { d: 22, h: 19, sym: "AUD/USD", setup: "sfp", want: "early", mistakes: ["exited too early"], note: "Closed at 0.7R, it ran to target without me." },
  { d: 21, h: 15, sym: "XAU/USD", setup: "gap-sfp", want: "win", note: "Gap SFP at the weekly open, full size." },
  { d: 20, h: 10, sym: "GBP/USD", setup: "same-way-level", want: "loss", note: "Asia level, thin liquidity." },
  { d: 18, h: 14, sym: "USD/JPY", setup: "inverse-level", want: "win", note: "LHPB from Friday, textbook." },
  { d: 17, h: 20, sym: "EUR/USD", setup: "accumulation", want: "loss", mistakes: ["traded news"], note: "Entered 10 minutes before the data." },
  { d: 16, h: 15, sym: "XAU/USD", setup: "sfp", want: "win", note: "London swept the prior day low and reclaimed." },
  { d: 15, h: 9, sym: "AUD/USD", setup: "same-way-level", want: "loss", note: "Same-way level again, again stopped." },
  { d: 13, h: 14, sym: "GBP/USD", setup: "same-way-level", want: "loss", rm: 0.8, note: "First loss of the day, fine." },
  { d: 13, h: "next", sym: "GBP/USD", setup: "same-way-level", want: "loss", rm: 0.8, mistakes: ["revenge trade"], note: "Back in straight away. Should have walked." },
  { d: 13, h: "next", sym: "EUR/USD", setup: "other", want: "loss", rm: 0.8, mistakes: ["revenge trade", "wrong size"], risk: 2, note: "Doubled down on a correlated pair. Daily limit hit." },
  { d: 11, h: 15, sym: "XAU/USD", setup: "inverse-level", want: "win", note: "Reset day, one trade, done." },
  { d: 10, h: 20, sym: "EUR/USD", setup: "gap", want: "win", note: "NY open gap fill." },
  { d: 9, h: 14, sym: "USD/JPY", setup: "sfp", want: "bigloss", mistakes: ["moved stop"], note: "Moved the stop once. Cost an extra half R." },
  { d: 7, h: 15, sym: "GBP/USD", setup: "inverse-level", want: "early", mistakes: ["exited too early"], note: "Took profit into the first candle against me." },
  { d: 6, h: 21, sym: "XAU/USD", setup: "same-way-level", want: "win", note: "Finally one from this setup." },
  { d: 5, h: 14, sym: "EUR/USD", setup: "sfp", want: "win", note: "Swept the London high, closed back under." },
  { d: 3, h: 10, sym: "AUD/USD", setup: "accumulation", want: "loss", mistakes: ["against daily bias"], note: "Daily was bearish, bought anyway." },
  { d: 2, h: 15, sym: "XAU/USD", setup: "gap-sfp", want: "win", note: "Weekly gap SFP, held to target." },
  { d: 1, h: 20, sym: "GBP/USD", setup: "inverse-level", want: "win", note: "Old support flipped, NY session." },
  { d: 0, h: 14, sym: "EUR/USD", setup: "inverse-level", want: "open", note: "Managing on the hourly." },
  { d: 0, h: 19, sym: "XAU/USD", setup: "sfp", want: "open", note: "Stop under the swept low." },
];

const H = 3_600_000;
const WIB = 7 * H;
const dp = (sym: string) => (sym === "XAU/USD" ? 2 : sym.includes("JPY") ? 3 : 5);
const round = (n: number, sym: string) => Number(n.toFixed(dp(sym)));

/** Walks bars from k: which comes first, the stop (lossMul R away) or the 2R target. */
function walk(bars: Candle[], k: number, buy: boolean, entry: number, risk: number, lossMul: number) {
  const dir = buy ? 1 : -1;
  let early: number | null = null;
  let mae = 0;
  for (let j = k; j < Math.min(bars.length, k + 72); j++) {
    const b = bars[j]!;
    const worst = buy ? b.low : b.high;
    const best = buy ? b.high : b.low;
    mae = Math.max(mae, ((entry - worst) * dir) / risk);
    if (mae >= lossMul) return { res: "loss" as const, j, early, mae };
    if (early === null && (best - entry) * dir >= 0.7 * risk) early = j;
    if ((best - entry) * dir >= 2 * risk) return { res: "win" as const, j, early, mae };
  }
  return { res: "none" as const, j: bars.length - 1, early, mae };
}

function build(s: Spec, bars: Candle[], k0: number, i: number): Trade | null {
  for (let shift = 0; shift < 24; shift++) {
    const k = k0 + shift;
    if (k >= bars.length || k < 24) return null;
    const risk = (bars.slice(k - 24, k).reduce((a, b) => a + b.high - b.low, 0) / 24) * (s.rm ?? 2.2);
    const entry = bars[k]!.open;
    for (const buy of i % 2 ? [false, true] : [true, false]) {
      const w = walk(bars, k, buy, entry, risk, s.want === "bigloss" ? 1.5 : 1);
      // Winners that nearly hit the stop leave the MAE analyser nothing to say, so prefer cleaner ones.
      const ok = s.want === "open" ? w.res === "none" : s.want === "win" || s.want === "early" ? w.res === "win" && w.mae < 0.8 : w.res === "loss";
      if (!ok) continue;
      const dir = buy ? 1 : -1;
      const j = s.want === "early" ? w.early! : w.j;
      const exit = s.want === "open" ? null : entry + dir * risk * (s.want === "win" ? 2 : s.want === "early" ? 0.7 : s.want === "bigloss" ? -1.5 : -1);
      const opened = Date.parse(bars[k]!.time) + 5 * 60_000;
      const closed = Date.parse(bars[j]!.time) + 45 * 60_000;
      const at = new Date(opened).toISOString();
      return {
        id: crypto.randomUUID(),
        symbol: s.sym,
        side: buy ? "buy" : "sell",
        setup: s.setup,
        timeframe: s.setup === "gap" || s.setup === "gap-sfp" ? "1D" : "1H",
        status: s.want === "open" ? "open" : "closed",
        entry: round(entry, s.sym),
        stop: round(entry - dir * risk, s.sym),
        target: round(entry + dir * 2 * risk, s.sym),
        exit: exit === null ? null : round(exit, s.sym),
        size: null,
        riskPct: s.risk ?? Math.min(riskTier(s.setup), MAX_RISK),
        openedAt: at,
        closedAt: s.want === "open" ? null : new Date(closed).toISOString(),
        followedPlan: s.want === "open" ? null : !s.mistakes?.length,
        mistakes: s.mistakes ?? [],
        notes: s.note,
        screenshotUrl: null,
        createdAt: at,
        updatedAt: s.want === "open" ? at : new Date(closed).toISOString(),
      };
    }
  }
  return null;
}

/** About 25 closed and 2 open trades over the last six weeks. Empty if no candles came back. */
export async function seedDemoTrades(): Promise<Trade[]> {
  const from = new Date(Date.now() - 50 * 24 * H).toISOString();
  const syms = [...new Set(SPECS.map((s) => s.sym))];
  const bars = new Map(await Promise.all(syms.map(async (s) => [s, (await journalBars(s, from)).hourly] as const)));
  const out: Trade[] = [];
  let prevClose = 0;
  SPECS.forEach((s, i) => {
    const hourly = bars.get(s.sym) ?? [];
    const days = [...new Set(hourly.map((b) => wibDate(Date.parse(b.time))))].filter((d) => wibWeekday(Date.parse(`${d}T12:00:00Z`) - WIB) < 5);
    const day = days.at(-1 - s.d);
    if (!day) return;
    const k0 =
      s.h === "next"
        ? hourly.findIndex((b) => Date.parse(b.time) > prevClose)
        : hourly.findIndex((b) => wibDate(Date.parse(b.time)) === day && wibHour(Date.parse(b.time)) >= (s.h as number));
    const t = k0 < 0 ? null : build(s, hourly, k0, i);
    if (!t) return;
    out.push(t);
    prevClose = Date.parse(t.closedAt ?? t.openedAt);
  });
  return out.reverse();
}
