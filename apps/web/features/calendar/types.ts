import type { CalendarEvent, Impact } from "@/lib/mock/types";

// ─────────────────────────────────────────────────────────────
// Anchor / "today" for the demo. The mock data is dated April
// 2026, so we anchor on the day inside that window where the
// dashboard / brief already pivot.
// ─────────────────────────────────────────────────────────────
export const DEMO_TODAY_YMD = "2026-04-07";

// ─────────────────────────────────────────────────────────────
// View / filter types
// ─────────────────────────────────────────────────────────────
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
