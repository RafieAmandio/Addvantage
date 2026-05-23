import { z } from "zod";

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

export const predictionService = {
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
