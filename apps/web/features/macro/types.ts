/** Mirrors apps/worker/src/macro/sync-macro.ts MacroData, as served by GET /macro. */
export const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "NZD", "CAD", "CHF"] as const;
export type Ccy = (typeof CURRENCIES)[number];

export interface RateOdds {
  title: string;
  meetingDate: string;
  outcomes: { label: string; p: number }[];
  volume: number;
  url: string;
}

export interface Bank {
  bank: string;
  rate: number;
  asOf: string;
  lastChange: number | null;
  lastChangeDate: string | null;
  odds?: RateOdds;
}

export interface Gauge {
  v: number;
  change: number | null;
  asOf: string;
  spark: number[];
}

export interface MacroData {
  banks: Partial<Record<Ccy, Bank>>;
  yields10y?: { months: string[]; series: Partial<Record<Ccy, (number | null)[]>> };
  usCurve?: { y2: number; y10: number; asOf: string };
  risk: { vix?: Gauge; move?: Gauge; ig?: Gauge; hy?: Gauge };
  syncedAt: string | null;
}
