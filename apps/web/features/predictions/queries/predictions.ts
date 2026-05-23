import { apiGet } from "@/lib/api/client-server";
import type { PredictionCardData } from "../types";

export async function listPredictions(): Promise<PredictionCardData[]> {
  return apiGet<PredictionCardData[]>("/predictions");
}
