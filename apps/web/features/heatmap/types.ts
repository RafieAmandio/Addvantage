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

export interface RsiTableRow {
  symbol: string;
  price: number | null;
  group: string;
  rsi1h: number | null;
  rsi4h: number | null;
  rsi1d: number | null;
  zone1h: string | null;
  zone4h: string | null;
  zone1d: string | null;
}

export interface RsiTableData {
  interval: "all";
  updatedAt: string | null;
  pairs: RsiTableRow[];
}

export type ViewMode = "chart" | "table";
