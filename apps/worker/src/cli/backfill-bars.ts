// One-off local backfill: wider windows than the scheduled sync (365d daily, 60d hourly).
import { prisma } from "@tradevantage/db";
import { config } from "../lib/config";
import { getBarsAdapter } from "../adapters/bars";
import { BAR_SYMBOLS, upsertBars } from "../bars/sync-bars";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function main() {
  const adapter = getBarsAdapter(config.MARKET_DATA_PROVIDER!);
  const to = new Date();
  for (const [interval, days] of [["1d", 365], ["1h", 60]] as const) {
    const from = new Date(to.getTime() - days * 86_400_000);
    for (const symbol of BAR_SYMBOLS) {
      try {
        const bars = await adapter.fetchBars({ symbol, interval, from, to });
        await upsertBars(symbol, interval, bars);
        console.log(interval, symbol, bars.length, "bars", bars[0] ? new Date(bars[0].ts).toISOString().slice(0, 10) : "", "→", bars.at(-1) ? new Date(bars.at(-1)!.ts).toISOString().slice(0, 16) : "");
      } catch (e) { console.log(interval, symbol, "FAILED", String(e).slice(0, 120)); }
      await delay(8000);
    }
  }
  await prisma.$disconnect();
}
main();
