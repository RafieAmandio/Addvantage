import { classifyRsi, FOREX_PAIRS } from "@tradevantage/shared";
import { rsiRepository } from "./rsi.repository.js";

const INTERVAL_DB_MAP: Record<string, string> = {
  "1h": "1h",
  "4h": "4h",
  "1d": "1day",
};

const groupLookup = new Map(FOREX_PAIRS.map((p) => [p.symbol, p.group]));

export const rsiService = {
  async getHeatmap(interval: string) {
    const dbInterval = INTERVAL_DB_MAP[interval] ?? interval;
    const rows = await rsiRepository.listByInterval(dbInterval);

    const pairs = rows.map((r) => ({
      symbol: r.symbol,
      rsi: Number(r.rsi),
      price: r.price !== null ? Number(r.price) : null,
      zone: classifyRsi(Number(r.rsi)),
      group: groupLookup.get(r.symbol) ?? "unknown",
      ts: r.ts.toISOString(),
    }));

    const updatedAt =
      rows.length > 0
        ? new Date(Math.max(...rows.map((r) => r.fetchedAt.getTime()))).toISOString()
        : null;

    return { interval, updatedAt, pairs };
  },
};
