import type { CalendarEvent, Impact } from "@/lib/mock/types";

// WIB (UTC+7) today — used as default anchor for the calendar view
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
