import type { BoardRow, Candle, DailyRead, Level } from "@tradevantage/shared";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import { checkPlan, killList, positionSize, riskTier, type Rule, type Trade } from "@/features/journal/lib/journal";
import { buildDrills, gradeThrust } from "@/features/method/lib/practice";
import { ATR_STATES, judgeAtr, judgeBreak, judgePattern, type Pattern } from "@/features/method/lib/scan";
import { allRows, boardSample, candles, heroSample, planSample, scanSample } from "./sample";

/**
 * Everything the landing page shows, read once at build time from the saved
 * real candles by the app's own functions. Plain numbers and strings only, so
 * the client demos get a small payload and no maths to redo.
 */

/** [open time ms, open, high, low, close] */
export type Bar = [number, number, number, number, number];
const bar = (c: Candle): Bar => [Date.parse(c.time), c.open, c.high, c.low, c.close];
const sym = (s: string) => s.replace("/", "");
const p = fmtPrice;

export interface TickerRow { sym: string; val: string; chg: string; dir: "up" | "down" }
export interface BoardLine { sym: string; call: BoardRow["call"]; why: string }
export interface ReadData {
  sym: string; bars: Bar[]; thrust: number; touch: number; side: Level["side"];
  price: number; stop: number; target: number; r: string; verdict: Level["verdict"];
  fmt: { price: string; stop: string; target: string; thrust: string };
}
export interface PracticeData {
  sym: string; bars: Bar[]; after: Bar[]; thrust: number; prompt: string; feedback: string;
  price: number; stop: number; target: number; kind: "win" | "loss"; r: string;
  fmt: { price: string; stop: string; target: string };
}
export interface ScanQuestion { ask: string; options: string[]; picks: { pick: string; ok: boolean; text: string }[] }
export interface ScanData { sym: string; days: Bar[]; questions: ScanQuestion[] }
export interface PlanData {
  sym: string; side: Level["side"]; entry: string; stop: string; target: string; market: string;
  over: { risk: string; rules: Rule[]; refusal: string };
  ok: { risk: string; rules: Rule[]; saved: string };
}
export interface KillData { sym: string; side: Level["side"]; risk: number; losses: { at: string; lost: string; blocks: Rule[] }[] }

/** One "tap the level" round for the hero card: a real drill cut at the retest, graded in the browser by the app's gradeLevel. */
export interface LevelRound { sym: string; bars: Bar[]; thrust: number; level: Level; daily: DailyRead }

export interface LandingData {
  asOf: string; markets: number; ticker: TickerRow[]; board: BoardLine[]; rounds: LevelRound[];
  read: ReadData; practice: PracticeData; scan: ScanData; plan: PlanData; kill: KillData;
}

function ticker(rows: BoardRow[]): TickerRow[] {
  return rows
    .filter((r) => r.close !== null && r.days.length > 1)
    .map((r) => {
      const prev = r.days.at(-2)!.close;
      const chg = ((r.close! - prev) / prev) * 100;
      return { sym: sym(r.symbol), val: p(r.close!), chg: `${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%`, dir: chg >= 0 ? "up" : "down" };
    });
}

function read(): ReadData {
  const row = boardSample().find((r) => r.level?.type === "inverse" && r.level.thrust && r.level.stop !== null && r.level.target !== null && r.candles.some((c) => c.time === r.level!.thrust!.time))!;
  const l = row.level!;
  const at = (iso: string) => row.candles.findIndex((c) => c.time === iso);
  const touch = l.touches.map(at).filter((i) => i >= 0)[0] ?? Math.max(0, at(l.thrust!.time) - 6);
  return {
    sym: sym(row.symbol), bars: row.candles.map(bar), thrust: at(l.thrust!.time), touch, side: l.side,
    price: l.price, stop: l.stop!, target: l.target!, r: (l.r ?? 0).toFixed(2), verdict: l.verdict,
    fmt: { price: p(l.price), stop: p(l.stop!), target: p(l.target!), thrust: wibStamp(l.thrust!.time) },
  };
}

function practice(): PracticeData {
  const { symbol, row } = heroSample();
  const { hourly, daily } = candles(symbol);
  // The latest drill that filled and finished, win or loss, whichever it was.
  const drill = buildDrills(hourly, daily).filter((d) => (d.outcome.kind === "win" || d.outcome.kind === "loss") && d.level.thrust && d.level.stop !== null && d.level.target !== null).at(-1)!;
  const l = drill.level;
  const t = hourly.findIndex((c) => c.time === l.thrust!.time);
  const start = Math.max(drill.from, Math.min(drill.cut - 40, t - 8));
  const bars = hourly.slice(start, drill.cut);
  const exit = hourly.findIndex((c) => c.time === drill.outcome.exitTime);
  const after = hourly.slice(drill.cut, Math.min(exit + 4, drill.cut + 36));
  const ask = l.side === "buy" ? "Tap the candle that broke up through resistance." : "Tap the candle that broke down through support.";
  return {
    sym: sym(row.symbol), bars: bars.map(bar), after: after.map(bar), thrust: t - start, prompt: ask,
    feedback: gradeThrust(l, bars, l.thrust!.time).feedback,
    price: l.price, stop: l.stop!, target: l.target!, kind: drill.outcome.kind as "win" | "loss",
    r: drill.outcome.kind === "win" ? `+${(drill.outcome.r ?? 0).toFixed(2)}R` : "-1R",
    fmt: { price: p(l.price), stop: p(l.stop!), target: p(l.target!) },
  };
}

function rounds(): LevelRound[] {
  const { symbol } = heroSample();
  const { hourly, daily } = candles(symbol);
  // The latest few drills whose swing and break both sit inside a 48 candle window.
  return buildDrills(hourly, daily)
    .map((d) => {
      const l = d.level;
      const start = Math.max(d.from, d.cut - 48);
      const bars = hourly.slice(start, d.cut);
      const t = bars.findIndex((c) => c.time === l.thrust?.time);
      const touch = l.touches.some((x) => bars.some((c) => c.time === x));
      return t >= 6 && touch ? { sym: sym(symbol), bars: bars.map(bar), thrust: t, level: l, daily: d.daily } : null;
    })
    .filter((x): x is LevelRound => x !== null)
    .slice(-4)
    .reverse();
}

function scan(): ScanData {
  const { row, facts } = scanSample();
  const truth: Pattern = facts.printed[0] ?? "Nothing";
  const wrong: Pattern = truth === "Hammer" ? "Shooting star" : "Hammer";
  const atrLabel = ATR_STATES.find((s) => s.key === facts.atr)!.label;
  const broke = facts.broke !== null;
  return {
    sym: sym(row.symbol),
    days: row.days.slice(-22).map(bar),
    questions: [
      { ask: "What printed on the last day?", options: [wrong, truth, "SFP"].filter((x, i, a) => a.indexOf(x) === i), picks: [wrong, truth].map((x) => ({ pick: x, ...judgePattern(facts, x) })) },
      { ask: "Did the close break a swing?", options: ["Yes", "No"], picks: [{ pick: broke ? "Yes" : "No", ...judgeBreak(facts, broke) }] },
      { ask: "Daily range?", options: ATR_STATES.map((s) => s.label), picks: [{ pick: atrLabel, ...judgeAtr(facts, facts.atr) }] },
    ],
  };
}

function plan(): PlanData {
  // The first board market whose plan clears every rule at its tier, so the demo can end green.
  for (const r of boardSample()) {
    const l = r.level;
    if (!l || l.type !== "inverse" || l.stop === null || l.target === null) continue;
    const { market } = planSample(r.symbol);
    const dp = (n: number) => Number(n.toFixed(p(l.price).split(".")[1]?.length ?? 0));
    const base = { symbol: r.symbol, side: l.side, setup: "inverse-level" as const, entry: l.price, stop: dp(l.stop), target: dp(l.target) };
    const tier = riskTier("inverse-level");
    const good = checkPlan({ ...base, riskPct: tier }, market);
    if (good.some((x) => x.met !== true)) continue;
    const size = positionSize(10_000, tier, base.entry, base.stop, r.symbol);
    return {
      sym: sym(r.symbol), side: l.side, entry: p(base.entry), stop: p(base.stop), target: p(base.target), market: p(market.price!),
      over: { risk: "3", rules: checkPlan({ ...base, riskPct: 3 }, market), refusal: "Risk must be above 0 and at most 2%." },
      ok: { risk: String(tier), rules: good, saved: `Saved as open. ${size ? `${(size.money).toLocaleString("en-US")} USD at risk on a 10,000 USD sample account.` : ""}` },
    };
  }
  throw new Error("No board market clears the plan rules");
}

function kill(pl: PlanData): KillData {
  const symbol = pl.sym.length === 6 ? `${pl.sym.slice(0, 3)}/${pl.sym.slice(3)}` : pl.sym;
  const now = Date.parse("2026-10-30T13:00:00Z"); // 20:00 WIB on the snapshot's last trading day
  const risk = riskTier("inverse-level");
  const entry = Number(pl.entry.replace(/,/g, ""));
  const stop = Number(pl.stop.replace(/,/g, ""));
  const trades: Trade[] = [];
  const losses: KillData["losses"] = [];
  for (const hoursAgo of [6, 4, 2]) {
    const closedAt = new Date(now - hoursAgo * 3_600_000).toISOString();
    trades.push({ id: String(trades.length), symbol, side: pl.side, setup: "inverse-level", timeframe: "1H", status: "closed", entry, stop, target: null, exit: stop, size: null, riskPct: risk, openedAt: closedAt, closedAt, followedPlan: true, mistakes: [], notes: "", screenshotUrl: null, createdAt: closedAt, updatedAt: closedAt });
    const g = killList({ symbol, side: pl.side, setup: "inverse-level", trades, events: [], equity: 10_000, price: null, atr: null, now });
    losses.push({ at: wibStamp(closedAt).slice(-9), lost: (risk * trades.length).toFixed(2), blocks: g.blocks });
  }
  return { sym: pl.sym, side: pl.side, risk, losses };
}

function wibStamp(iso: string) {
  const d = new Date(Date.parse(iso) + 7 * 3_600_000);
  const mon = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  return `${d.getUTCDate()} ${mon} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} WIB`;
}

export function landingData(): LandingData {
  const rows = allRows();
  const pl = plan();
  const last = Math.max(...rows.map((r) => (r.asOf ? Date.parse(r.asOf) : 0)));
  return {
    asOf: new Date(last).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).toUpperCase(),
    markets: rows.length,
    ticker: ticker(rows),
    board: rows.map((r) => ({ sym: sym(r.symbol), call: r.call, why: r.why })),
    rounds: rounds(),
    read: read(),
    practice: practice(),
    scan: scan(),
    plan: pl,
    kill: kill(pl),
  };
}
