import { FOREX_PAIRS } from "@tradevantage/shared";
import { gapScreenerRepository } from "./gap-screener.repository.js";

const pairLookup = new Map(FOREX_PAIRS.map((p) => [p.symbol, p]));

const SL_MULTIPLIER = 1.5;

export const gapScreenerService = {
  async getScanner() {
    const rows = await gapScreenerRepository.listActive();

    const pairs = rows.map((r) => {
      const gapPct = Number(r.gapPct);
      const fridayClose = Number(r.fridayClose);
      const mondayOpen = Number(r.mondayOpen);
      const gapSize = Math.abs(mondayOpen - fridayClose);
      const slSize = gapSize * SL_MULTIPLIER;
      const rr = slSize > 0 ? gapSize / slSize : 0;

      return {
        symbol: r.symbol,
        fridayClose,
        mondayOpen,
        currentPrice: r.currentPrice !== null ? Number(r.currentPrice) : null,
        gapPct,
        gapDirection: r.gapDirection as "UP" | "DOWN",
        fillPct: Number(r.fillPct),
        status: r.status as "active" | "filled" | "expired",
        setup: r.gapDirection === "UP" ? "SELL" : "BUY",
        rr: Math.round(rr * 100) / 100,
        group: pairLookup.get(r.symbol)?.group ?? "unknown",
        tier: pairLookup.get(r.symbol)?.tier ?? "thirdliner",
        weekStart: r.weekStart.toISOString().slice(0, 10),
        ts: r.ts.toISOString(),
      };
    });

    pairs.sort((a, b) => b.gapPct - a.gapPct);

    const updatedAt =
      rows.length > 0
        ? new Date(Math.max(...rows.map((r) => r.fetchedAt.getTime()))).toISOString()
        : null;

    return { updatedAt, pairs };
  },
};
