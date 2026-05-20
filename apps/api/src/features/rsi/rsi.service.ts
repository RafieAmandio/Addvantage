import { classifyRsi, FOREX_PAIRS } from "@tradevantage/shared";
import { rsiRepository } from "./rsi.repository.js";

const INTERVAL_DB_MAP: Record<string, string> = {
  "1h": "1h",
  "4h": "4h",
  "1d": "1day",
};

const DB_TO_API: Record<string, string> = { "1h": "1h", "4h": "4h", "1day": "1d" };

const pairLookup = new Map(FOREX_PAIRS.map((p) => [p.symbol, p]));

export const rsiService = {
  async getHeatmap(interval: string) {
    if (interval === "all") return this.getTable();

    const dbInterval = INTERVAL_DB_MAP[interval] ?? interval;
    const rows = await rsiRepository.listByInterval(dbInterval);

    const pairs = rows.map((r) => ({
      symbol: r.symbol,
      rsi: Number(r.rsi),
      price: r.price !== null ? Number(r.price) : null,
      zone: classifyRsi(Number(r.rsi)),
      group: pairLookup.get(r.symbol)?.group ?? "unknown",
      ts: r.ts.toISOString(),
    }));

    const updatedAt =
      rows.length > 0
        ? new Date(Math.max(...rows.map((r) => r.fetchedAt.getTime()))).toISOString()
        : null;

    return { interval, updatedAt, pairs };
  },

  async getTable() {
    const rows = await rsiRepository.listAll();

    const grouped = new Map<string, {
      price: number | null;
      group: string;
      rsi1h: number | null; rsi4h: number | null; rsi1d: number | null;
      zone1h: string | null; zone4h: string | null; zone1d: string | null;
    }>();

    for (const r of rows) {
      const sym = r.symbol;
      if (!grouped.has(sym)) {
        grouped.set(sym, {
          price: r.price !== null ? Number(r.price) : null,
          group: pairLookup.get(sym)?.group ?? "unknown",
          rsi1h: null, rsi4h: null, rsi1d: null,
          zone1h: null, zone4h: null, zone1d: null,
        });
      }
      const entry = grouped.get(sym)!;
      const rsi = Number(r.rsi);
      const apiInterval = DB_TO_API[r.interval] ?? r.interval;
      if (apiInterval === "1h") { entry.rsi1h = rsi; entry.zone1h = classifyRsi(rsi); }
      else if (apiInterval === "4h") { entry.rsi4h = rsi; entry.zone4h = classifyRsi(rsi); }
      else if (apiInterval === "1d") { entry.rsi1d = rsi; entry.zone1d = classifyRsi(rsi); }
      if (r.price !== null) entry.price = Number(r.price);
    }

    const pairs = Array.from(grouped.entries()).map(([symbol, data]) => ({
      symbol,
      ...data,
    }));

    const updatedAt =
      rows.length > 0
        ? new Date(Math.max(...rows.map((r) => r.fetchedAt.getTime()))).toISOString()
        : null;

    return { interval: "all", updatedAt, pairs };
  },

  async getDetail(symbol: string) {
    const rows = await rsiRepository.listBySymbol(symbol);
    const pair = pairLookup.get(symbol);

    const intervals: Record<string, { rsi: number; zone: string; ts: string }> = {};
    let price: number | null = null;

    for (const r of rows) {
      const apiInterval = DB_TO_API[r.interval] ?? r.interval;
      const rsi = Number(r.rsi);
      intervals[apiInterval] = { rsi, zone: classifyRsi(rsi), ts: r.ts.toISOString() };
      if (r.price !== null) price = Number(r.price);
    }

    return {
      symbol,
      label: pair?.label ?? symbol,
      group: pair?.group ?? "unknown",
      price,
      intervals,
    };
  },
};
