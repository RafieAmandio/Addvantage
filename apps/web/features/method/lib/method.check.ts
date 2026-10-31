// Run from apps/web: pnpm exec tsx features/method/lib/method.check.ts
import assert from "node:assert/strict";
import { atr, readDaily, readLevels, type Candle } from "@tradevantage/shared";

const day = (i: number, o: number, h: number, l: number, c: number): Candle => ({ time: new Date(Date.UTC(2026, 0, 1) + i * 86_400_000).toISOString(), open: o, high: h, low: l, close: c });
const now = Date.UTC(2026, 6, 1);

// Flat 1.0 range bars: ATR settles at 1.
const base = Array.from({ length: 30 }, (_, i) => day(i, 10, 10.5, 9.5, 10));
assert.equal(atr(base), 1);

// Hammer: probes under yesterday's low, closes back inside, long lower wick.
const hammer = readDaily([...base, day(30, 10.1, 10.2, 8.9, 10.15)], now);
assert.equal(hammer.bias, "bullish");
assert.ok(hammer.signals.some((s) => s.name === "Hammer" && s.entry === 10.2));

// Inside day failure: mother, inside, poke over the inside high and close back under it.
const idf = readDaily([...base, day(30, 10, 11, 9, 10.2), day(31, 10.2, 10.6, 9.8, 10.3), day(32, 10.3, 10.8, 10.1, 10.4)], now);
assert.ok(idf.signals.some((s) => s.kind === "idf" && s.dir === "bearish" && s.entry === 10.6));

// Hourly: three highs at 100, a thrust candle closes through, price runs and stays above. Buy LHPB 100.
const hour = (i: number, o: number, h: number, l: number, c: number): Candle => ({ time: new Date(Date.UTC(2026, 5, 1) + i * 3_600_000).toISOString(), open: o, high: h, low: l, close: c });
const h: Candle[] = [];
for (let k = 0; k < 3; k++) h.push(hour(h.length, 98, 98.5, 97.5, 98), hour(h.length + 1, 98, 99, 97.8, 98.6), hour(h.length + 2, 98.6, 100, 98.2, 98.4), hour(h.length + 3, 98.4, 98.8, 97.6, 98), hour(h.length + 4, 98, 98.4, 97.5, 98.1));
h.push(hour(h.length, 98.2, 101.2, 98.1, 101)); // thrust
h.push(hour(h.length, 101, 102.4, 100.8, 102.2), hour(h.length, 102.2, 103, 101.9, 102.6), hour(h.length, 102.6, 102.7, 101.5, 101.7), hour(h.length, 101.7, 101.9, 100.9, 101.2), hour(h.length, 101.2, 101.5, 100.7, 101));
const d = { ...readDaily(base.map((b) => ({ ...b, open: b.open * 10, high: b.high * 10 + 20, low: b.low * 10 - 20, close: b.close * 10 })), now) };
const lv = readLevels(h, d).find((l) => l.type === "inverse" && l.side === "buy");
if (!lv) throw new Error("LHPB not found");
assert.equal(lv.price, 100);
assert.equal(lv.touches.length, 3);
assert.equal(lv.naked, true);
assert.equal(lv.target, 103);
console.log("method.check ok");
