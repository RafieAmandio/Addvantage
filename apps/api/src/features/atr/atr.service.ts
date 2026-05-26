import { classifyAtrExhaustion, FOREX_PAIRS } from "@tradevantage/shared";
import { atrRepository } from "./atr.repository.js";

const pairLookup = new Map(FOREX_PAIRS.map((p) => [p.symbol, p]));

export const atrService = {
  async getScanner() {
    const rows = await atrRepository.listAll();

    const pairs = rows.map((r) => ({
      symbol: r.symbol,
      atr: Number(r.atr),
      price: r.price !== null ? Number(r.price) : null,
      dailyOpen: Number(r.dailyOpen),
      dailyHigh: Number(r.dailyHigh),
      dailyLow: Number(r.dailyLow),
      dailyClose: Number(r.dailyClose),
      upperLevel: Number(r.upperLevel),
      lowerLevel: Number(r.lowerLevel),
      exhaustionPct: Number(r.exhaustionPct),
      direction: r.direction as "bullish" | "bearish",
      zone: classifyAtrExhaustion(Number(r.exhaustionPct)),
      group: pairLookup.get(r.symbol)?.group ?? "unknown",
      ts: r.ts.toISOString(),
    }));

    pairs.sort((a, b) => b.exhaustionPct - a.exhaustionPct);

    const updatedAt =
      rows.length > 0
        ? new Date(Math.max(...rows.map((r) => r.fetchedAt.getTime()))).toISOString()
        : null;

    return { updatedAt, pairs };
  },

  async getDetail(symbol: string) {
    const row = await atrRepository.findBySymbol(symbol);
    if (!row) return null;

    const pair = pairLookup.get(symbol);
    return {
      symbol,
      label: pair?.label ?? symbol,
      group: pair?.group ?? "unknown",
      atr: Number(row.atr),
      price: row.price !== null ? Number(row.price) : null,
      dailyOpen: Number(row.dailyOpen),
      dailyHigh: Number(row.dailyHigh),
      dailyLow: Number(row.dailyLow),
      dailyClose: Number(row.dailyClose),
      upperLevel: Number(row.upperLevel),
      lowerLevel: Number(row.lowerLevel),
      exhaustionPct: Number(row.exhaustionPct),
      direction: row.direction,
      zone: classifyAtrExhaustion(Number(row.exhaustionPct)),
      ts: row.ts.toISOString(),
    };
  },
};
