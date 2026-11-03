// Read-only check of the candle feed: fetches every BAR_SYMBOL at 1h and 1d and asserts the bars are usable.
// No database writes. Run: ./node_modules/.bin/tsx src/cli/check-bars.ts
import assert from "node:assert/strict";
import { BAR_SYMBOLS, adapterFor, pauseAfter } from "../bars/sync-bars";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function main() {
  const to = new Date();
  let failed = 0;
  for (const symbol of BAR_SYMBOLS) {
    const adapter = adapterFor(symbol);
    for (const [interval, days, min] of [["1h", 10, 40], ["1d", 120, 60]] as const) {
      try {
        const bars = await adapter.fetchBars({ symbol, interval, from: new Date(to.getTime() - days * 86_400_000), to });
        assert.ok(bars.length >= min, `only ${bars.length} bars`);
        for (let i = 0; i < bars.length; i++) {
          const b = bars[i]!;
          assert.ok(b.low <= Math.min(b.open, b.close) && b.high >= Math.max(b.open, b.close), `bad OHLC at ${b.ts}`);
          if (i) assert.ok(b.ts > bars[i - 1]!.ts, `not ascending at ${b.ts}`);
        }
        if (interval === "1d" && symbol.includes("/")) {
          // Yahoo's raw daily FX bars close where they open; real days have bodies.
          const body = bars.reduce((s, b) => s + Math.abs(b.close - b.open) / Math.max(b.high - b.low, 1e-9), 0) / bars.length;
          assert.ok(body > 0.25, `fake dojis, mean body/range ${body.toFixed(2)}`);
          // The FX day rolls at 17:00 New York, so there is no Saturday and no Sunday stub.
          const weekend = bars.filter((b) => [0, 6].includes(new Date(b.ts).getUTCDay())).map((b) => b.ts.slice(0, 10));
          assert.ok(weekend.length === 0, `weekend candles ${weekend.join(",")}`);
        }
        const last = bars.at(-1)!;
        assert.ok(to.getTime() - new Date(last.ts).getTime() < (interval === "1h" ? 4 : 5) * 86_400_000, `stale, last ${last.ts}`);
        console.log("ok  ", interval, symbol.padEnd(9), adapter.code.padEnd(10), String(bars.length).padStart(4), "bars, last", last.ts.slice(0, 16), "close", last.close);
      } catch (e) {
        failed++;
        console.log("FAIL", interval, symbol.padEnd(9), adapter.code.padEnd(10), String(e).slice(0, 140));
      }
      await delay(pauseAfter(adapter));
    }
  }
  console.log(failed ? `${failed} FAILED` : `all ${BAR_SYMBOLS.length} symbols ok`);
  process.exit(failed ? 1 : 0);
}
main();
