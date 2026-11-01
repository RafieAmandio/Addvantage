// Run from apps/web: ../api/node_modules/.bin/tsx features/journal/lib/journal.check.ts
import assert from "node:assert/strict";
import type { Candle } from "@tradevantage/shared";
import {
  breakers, checkPlan, drawdownR, excursion, killList, maeFinding, manageTrade, plannedR, positionSize, stats, tradeExcursion, tradeR, wibDate, wibHour, wibWeekStart,
  type Excursion, type Trade,
} from "./journal";

const H = 3_600_000;
const near = (a: number | null, b: number, eps = 1e-9) => assert.ok(a !== null && Math.abs(a - b) < eps, `${a} != ${b}`);

// R: signed right for both sides.
near(plannedR(1.1, 1.09, 1.12), 2);
near(tradeR({ entry: 1.1, stop: 1.09, exit: 1.12 }), 2);
near(tradeR({ entry: 1.1, stop: 1.11, exit: 1.08 }), 2);
near(tradeR({ entry: 1.1, stop: 1.11, exit: 1.11 }), -1);
assert.equal(plannedR(1, 1, 2), null);

// Size: quote = USD, base = USD, cross, non-FX.
const eu = positionSize(10_000, 1.5, 1.1, 1.095, "EUR/USD")!;
near(eu.money, 150);
near(eu.units, 30_000, 1e-6);
near(eu.lots, 0.3, 1e-9);
near(positionSize(10_000, 1, 150, 149, "USD/JPY")!.units, 15_000, 1e-6);
assert.ok(positionSize(10_000, 1, 0.85, 0.86, "EUR/GBP")!.note);
assert.equal(positionSize(10_000, 1, 2400, 2390, "XAU/USD")!.lots, null);
near(positionSize(10_000, 5, 1.1, 1.09, "EUR/USD")!.money, 200); // hard cap 2%

// Plan check: wrong-side stop and R under 0.5 fail; the good plan passes those.
const m = { daily: null, levels: [], price: 1.105 };
const bad = checkPlan({ symbol: "EUR/USD", side: "buy", setup: "sfp", entry: 1.1, stop: 1.11, target: 1.102, riskPct: 2 }, m);
assert.equal(bad[0]!.met, false);
assert.equal(bad[1]!.met, false);
assert.equal(bad.at(-1)!.met, false); // sfp tier is 1.5%
const good = checkPlan({ symbol: "EUR/USD", side: "buy", setup: "gap-sfp", entry: 1.1, stop: 1.09, target: 1.12, riskPct: 2 }, m);
assert.deepEqual([good[0]!.met, good[1]!.met, good[3]!.met, good.at(-1)!.met], [true, true, true, true]);

// WIB clock.
const mon = Date.UTC(2026, 10, 2, 3); // Mon 2 Nov 10:00 WIB
assert.equal(wibDate(mon), "2026-11-02");
assert.equal(wibHour(Date.UTC(2026, 10, 2, 16)), 23);
assert.equal(wibWeekStart(mon), Date.UTC(2026, 10, 1, 17));
assert.equal(wibWeekStart(Date.UTC(2026, 10, 1, 16)), Date.UTC(2026, 9, 25, 17)); // Sun 23:00 WIB still last week

let n = 0;
const trade = (o: Partial<Trade>): Trade => ({
  id: String(++n), symbol: "EUR/USD", side: "buy", setup: "sfp", timeframe: "1H", status: "closed", entry: 1.1, stop: 1.09, target: 1.12, exit: 1.09, size: null, riskPct: 1.5,
  openedAt: new Date(mon - 2 * H).toISOString(), closedAt: new Date(mon - H).toISOString(), followedPlan: true, mistakes: [], notes: "", screenshotUrl: null, createdAt: "", updatedAt: "", ...o,
});
const base = { symbol: "GBP/USD", side: "buy" as const, setup: "sfp" as const, events: [], equity: 10_000, price: 1.3, atr: 0.01, now: mon };

// Kill list.
assert.equal(killList({ ...base, trades: [] }).blocks.length, 0);
assert.ok(killList({ ...base, trades: [], now: Date.UTC(2026, 10, 2, 16, 5) }).blocks.some((b) => b.rule.startsWith("After 23")));
const news = (mins: number) => [{ ts: new Date(mon + mins * 60_000).toISOString(), title: "USD CPI", currency: "USD", impact: "high" }];
assert.equal(killList({ ...base, trades: [], events: news(10) }).blocks.length, 1);
assert.equal(killList({ ...base, trades: [], events: news(90) }).warns.length, 1);
assert.equal(killList({ ...base, trades: [], events: news(300) }).warns.length, 0);
// 3 losses at 1.5% = 4.5% lost today, also 3 in a row is not 4.
const three = [trade({}), trade({}), trade({})];
const g3 = killList({ ...base, trades: three });
assert.ok(g3.blocks.some((b) => b.rule === "Daily loss limit"));
assert.ok(!g3.blocks.some((b) => b.rule === "4 losses in a row"));
assert.ok(killList({ ...base, trades: [...three, trade({ riskPct: 0.1 })] }).blocks.some((b) => b.rule === "4 losses in a row"));
assert.ok(killList({ ...base, trades: [trade({ exit: 1.12, followedPlan: false })] }).blocks.some((b) => b.rule === "Rule broken today"));
assert.ok(killList({ ...base, trades: [trade({ status: "open", exit: null, closedAt: null, symbol: "EUR/USD" })] }).warns.some((w) => w.rule === "Correlated exposure")); // both short USD
assert.equal(killList({ ...base, side: "sell", trades: [trade({ status: "open", exit: null, closedAt: null, symbol: "EUR/USD" })] }).warns.length, 0);

// Circuit breakers: drawdown from the running peak.
near(drawdownR([2, -1, -1, 3, -5]), 5);
near(drawdownR([-1, -1]), 2);
const tenLosses = Array.from({ length: 10 }, (_, i) => trade({ setup: "gap", closedAt: new Date(mon - (30 - i) * 24 * H).toISOString(), openedAt: new Date(mon - (31 - i) * 24 * H).toISOString() }));
near(breakers(tenLosses).perSetup.find((s) => s.setup === "gap")!.dd, 10);
assert.ok(killList({ ...base, setup: "gap", trades: tenLosses }).blocks.some((b) => b.rule === "Gap halted"));
assert.ok(!killList({ ...base, setup: "sfp", trades: tenLosses }).blocks.some((b) => b.rule.endsWith("halted")));

// Excursion: buy at 1.1, stop 1.09; low 1.096 = 40% MAE, high 1.115 = 1.5R MFE.
const bar = (i: number, h: number, l: number, c = (h + l) / 2): Candle => ({ time: new Date(mon + i * H).toISOString(), open: c, high: h, low: l, close: c });
const e = excursion({ side: "buy", entry: 1.1, stop: 1.09 }, [bar(0, 1.101, 1.096), bar(1, 1.115, 1.1)]);
near(e.mae, 0.4, 1e-9);
near(e.mfe, 1.5, 1e-9);
const tx = tradeExcursion(trade({ openedAt: new Date(mon).toISOString(), closedAt: new Date(mon + H).toISOString(), exit: 1.11 }), [bar(0, 1.101, 1.096), bar(1, 1.115, 1.1), bar(3, 1.13, 1.11)])!;
near(tx.r, 1, 1e-9);
near(tx.after, 2, 1e-9); // 1.13 - 1.11 = 2R left after the exit

// Manager: evolving R = remaining reward / remaining risk from the last close.
const mt = manageTrade(trade({ status: "open", exit: null, closedAt: null, openedAt: new Date(mon).toISOString(), target: 1.12 }), [bar(0, 1.101, 1.096, 1.1), bar(1, 1.119, 1.117, 1.118)])!;
near(mt.evolvingR, 0.002 / 0.028, 1e-9);
assert.equal(mt.exit, true);

// MAE finding: winners at 10/20/38% MAE, two losers. Stop at 45% keeps all 3 winners.
const xs: Excursion[] = [
  { id: "a", r: 1, mae: 0.1, mfe: 1, after: 0 },
  { id: "b", r: 2, mae: 0.2, mfe: 2, after: 0 },
  { id: "c", r: 1.5, mae: 0.38, mfe: 1.5, after: 0 },
  { id: "d", r: -1, mae: 1, mfe: 0.2, after: 0 },
  { id: "e", r: -1, mae: 1, mfe: 0.1, after: 0 },
];
const f = maeFinding(xs)!;
assert.equal(f.stopPct, 45);
assert.equal(f.kept, 3);
near(f.avgBefore, 0.5);
near(f.avgAfter, (1 / 0.45 + 2 / 0.45 + 1.5 / 0.45 - 2) / 5);
assert.ok(f.text.includes("38%") && !/[–—]/.test(f.text));

// Expectancy.
const s = stats([2, -1, 1, -1]);
near(s.expectancy, 0.25);
near(s.strike, 50);
near(s.avgWin, 1.5);
near(s.avgLoss, -1);

console.log("journal.check ok");
