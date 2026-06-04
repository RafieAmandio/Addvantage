export interface GapPair {
  symbol: string;
  group: string;
  tier: string;
  fridayClose: number;
  mondayOpen: number;
  currentPrice: number | null;
  gapPct: number;
  gapDirection: "UP" | "DOWN";
  fillPct: number;
  status: "active" | "filled" | "expired";
  setup: "BUY" | "SELL";
  rr: number;
  weekStart: string;
  ts: string;
}

export interface GapScannerData {
  updatedAt: string | null;
  pairs: GapPair[];
}
