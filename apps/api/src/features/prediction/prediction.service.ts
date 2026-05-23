import { z } from "zod";
import { predictionRepository } from "./prediction.repository.js";

const CLOB_BASE = "https://clob.polymarket.com";
const UA = "TradeVantage/1.0";

const PriceHistoryPointSchema = z.object({
  t: z.number(),
  p: z.number(),
});

const PriceHistoryResponseSchema = z.object({
  history: z.array(PriceHistoryPointSchema).default([]),
});

interface HistoryOpts {
  tokenId: string;
  interval: "1d" | "1w" | "1m" | "max";
  fidelity: number;
}

interface Outcome {
  label: string;
  probability: number;
  odds: number;
  tokenId: string | null;
  weekChange: number | null;
}

export const predictionService = {
  async list() {
    const tracked = await predictionRepository.listTrackedWithLatestSnapshot();

    const activeIds = tracked.filter((t) => t.eventId).map((t) => t.id);
    if (activeIds.length === 0) return [];

    const weekSnapshots = await predictionRepository.listWeekSnapshots(activeIds);

    const weekRangeByTracked = new Map<string, { min: number; max: number }>();
    for (const snap of weekSnapshots) {
      const snapOutcomes = snap.outcomes as unknown as Outcome[];
      const topProb = snapOutcomes[0]?.probability ?? 0;
      const existing = weekRangeByTracked.get(snap.trackedId);
      if (existing) {
        if (topProb < existing.min) existing.min = topProb;
        if (topProb > existing.max) existing.max = topProb;
      } else {
        weekRangeByTracked.set(snap.trackedId, { min: topProb, max: topProb });
      }
    }

    const results = [];

    for (const t of tracked) {
      if (!t.eventId) continue;
      const latest = t.snapshots[0];
      if (!latest) continue;

      const outcomes = (latest.outcomes as unknown as Outcome[]) ?? [];
      const raw = weekRangeByTracked.get(t.id);
      const weekRange = raw
        ? { min: Math.round(raw.min * 10) / 10, max: Math.round(raw.max * 10) / 10 }
        : null;

      results.push({
        tracked: {
          id: t.id,
          category: t.category,
          label: t.label,
          eventId: t.eventId,
          eventSlug: t.eventSlug,
          eventTitle: t.eventTitle,
          sortOrder: t.sortOrder,
        },
        outcomes,
        volume: latest.volume ? Number(latest.volume) : null,
        liquidity: latest.liquidity ? Number(latest.liquidity) : null,
        marketCount: latest.marketCount,
        fetchedAt: latest.fetchedAt.toISOString(),
        weekRange,
      });
    }

    return results;
  },

  async getHistory(opts: HistoryOpts) {
    const params = new URLSearchParams({
      market: opts.tokenId,
      interval: opts.interval,
      fidelity: String(opts.fidelity),
    });

    const res = await fetch(`${CLOB_BASE}/prices-history?${params}`, {
      headers: { "User-Agent": UA },
    });
    if (!res.ok) {
      throw new Error(`clob/prices-history: HTTP ${res.status}`);
    }

    const raw = await res.json();
    const parsed = PriceHistoryResponseSchema.safeParse(raw);
    if (!parsed.success) return { history: [] };

    return { history: parsed.data.history };
  },
};
