// One-off backfill: wider windows than the scheduled sync (365d daily, 60d hourly), every BAR_SYMBOL via adapterFor.
import { prisma } from "@tradevantage/db";
import { BAR_SYMBOLS, adapterFor, pauseAfter, upsertBars } from "../bars/sync-bars";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function main() {
  const to = new Date();
  for (const [interval, days] of [["1d", 365], ["1h", 60]] as const) {
    const from = new Date(to.getTime() - days * 86_400_000);
    for (const symbol of BAR_SYMBOLS) {
      const adapter = adapterFor(symbol);
      try {
        const bars = await adapter.fetchBars({ symbol, interval, from, to });
        await upsertBars(symbol, interval, bars);
        console.log(interval, symbol, adapter.code, bars.length, "bars", bars[0] ? new Date(bars[0].ts).toISOString().slice(0, 10) : "", "→", bars.at(-1) ? new Date(bars.at(-1)!.ts).toISOString().slice(0, 16) : "");
      } catch (e) { console.log(interval, symbol, "FAILED", String(e).slice(0, 120)); }
      await delay(pauseAfter(adapter));
    }
  }
  await prisma.$disconnect();
}
main();
