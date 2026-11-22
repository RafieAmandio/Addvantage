import { test } from "node:test";
import assert from "node:assert/strict";
import { rsi, to4h, type Candle } from "./bars-candles";

test("rsi matches the Wilder reference values", () => {
  // Classic 14-period example (Wilder / StockCharts): RSI of the first window is 70.46, next 66.25.
  const closes = [44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28];
  assert.equal(rsi(closes)!.toFixed(2), "70.46");
  assert.equal(rsi([...closes, 46.0])!.toFixed(2), "66.25");
  assert.equal(rsi(closes.slice(0, 10)), null);
  assert.equal(rsi([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]), 100);
});

test("to4h merges hourly candles on the UTC 4h grid", () => {
  const h = (hr: number, o: number, hi: number, lo: number, c: number): Candle => ({
    datetime: `2026-11-20T${String(hr).padStart(2, "0")}:00:00.000Z`, open: o, high: hi, low: lo, close: c,
  });
  const out = to4h([h(2, 1, 2, 0.5, 1.5), h(3, 1.5, 3, 1, 2), h(4, 2, 2.5, 1.8, 2.2), h(7, 2.2, 4, 2, 3)]);
  assert.deepEqual(out, [
    { datetime: "2026-11-20T00:00:00.000Z", open: 1, high: 3, low: 0.5, close: 2 },
    { datetime: "2026-11-20T04:00:00.000Z", open: 2, high: 4, low: 1.8, close: 3 },
  ]);
});
