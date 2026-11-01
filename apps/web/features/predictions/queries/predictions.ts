import { apiGet } from "@/lib/api/client-server";
import { isMockMode } from "@/lib/config/public";
import type { PredictionCardData, PriceHistoryPoint } from "../types";
import { demoHistory, demoPredictions } from "./demo";

export async function listPredictions(): Promise<PredictionCardData[]> {
  if (isMockMode()) return demoPredictions();
  return apiGet<PredictionCardData[]>("/predictions");
}

export async function getPredictionHistory(tokenId: string): Promise<PriceHistoryPoint[]> {
  if (isMockMode()) return demoHistory(tokenId);
  const res = await apiGet<{ history: PriceHistoryPoint[] }>(
    `/predictions/history?tokenId=${encodeURIComponent(tokenId)}&interval=max`,
  ).catch(() => ({ history: [] }));
  return res.history;
}
