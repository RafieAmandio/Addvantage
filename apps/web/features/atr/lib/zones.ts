import type { AtrZoneId } from "../types";

export const GROUP_LABELS: Record<string, string> = {
  major: "Major",
  cross: "Cross",
  commodity: "Commodity",
  index: "Index",
};

export const ATR_ZONE_CONFIG: Record<
  AtrZoneId,
  { label: string; color: string; bg: string; min: number; max: number }
> = {
  exceeded: { label: "Exceeded", color: "#FF454D", bg: "rgba(255,69,77,0.10)", min: 100, max: Infinity },
  critical: { label: "Critical", color: "#FFD400", bg: "rgba(255,212,0,0.08)", min: 75, max: 100 },
  high:     { label: "High",     color: "rgba(255,212,0,0.55)", bg: "rgba(255,212,0,0.04)", min: 50, max: 75 },
  moderate: { label: "Moderate", color: "rgba(255,255,255,0.55)", bg: "transparent", min: 25, max: 50 },
  fresh:    { label: "Fresh",    color: "rgba(255,255,255,0.30)", bg: "transparent", min: 0,  max: 25 },
};

export const ATR_ZONES_ORDERED: AtrZoneId[] = [
  "exceeded",
  "critical",
  "high",
  "moderate",
  "fresh",
];
