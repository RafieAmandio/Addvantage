export type { RsiZoneId } from "@tradevantage/shared";

export interface RsiPair {
  symbol: string;
  rsi: number;
  price: number | null;
  zone: "overbought" | "strong" | "neutral" | "weak" | "oversold";
  group: string;
  ts: string;
}

export interface RsiHeatmapData {
  interval: string;
  updatedAt: string | null;
  pairs: RsiPair[];
}
