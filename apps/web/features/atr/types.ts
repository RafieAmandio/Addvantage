export type AtrZoneId = "exceeded" | "critical" | "high" | "moderate" | "fresh";

export interface AtrPair {
  symbol: string;
  atr: number;
  price: number | null;
  dailyOpen: number;
  dailyHigh: number;
  dailyLow: number;
  dailyClose: number;
  upperLevel: number;
  lowerLevel: number;
  exhaustionPct: number;
  direction: "bullish" | "bearish";
  zone: AtrZoneId;
  group: string;
  ts: string;
}

export interface AtrScannerData {
  updatedAt: string | null;
  pairs: AtrPair[];
}
