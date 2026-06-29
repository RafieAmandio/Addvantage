export type Impact = "high" | "medium" | "low";

export interface CalendarEvent {
  id: string;
  ts: string;
  region: "US" | "EU" | "UK" | "JP" | "CN" | "ID" | "GLOBAL";
  title: string;
  impact: Impact;
  actual?: string;
  previous?: string;
  consensus?: string;
  forecast?: string;
  notes?: string;
  relatedNewsId?: string;
}

export interface CalendarDayMeta {
  date: string;
  summary: string;
}

export const TODAY_YMD = new Date(Date.now() + 7 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

export type ViewMode = "day" | "week" | "month";
export type ImpactFilter = "all" | Impact;
export type RegionFilter = "all" | CalendarEvent["region"];

export const REGIONS: ReadonlyArray<CalendarEvent["region"]> = [
  "US",
  "EU",
  "UK",
  "JP",
  "CN",
  "ID",
  "GLOBAL",
];
