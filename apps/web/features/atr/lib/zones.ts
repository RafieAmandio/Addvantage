import type { AtrZoneId } from "../types";

export const GROUP_LABELS: Record<string, string> = {
  major: "Major",
  cross: "Cross",
  commodity: "Commodity",
  exotic: "Exotic",
  index: "Index",
};

export const ATR_ZONE_CONFIG: Record<
  AtrZoneId,
  { label: string; color: string; bg: string; min: number; max: number }
> = {
  exceeded: { label: "EXCEEDED", color: "#FF6B35", bg: "rgba(255,107,53,0.10)", min: 100, max: Infinity },
  critical: { label: "CRITICAL", color: "#FFD400", bg: "rgba(255,212,0,0.08)", min: 75, max: 100 },
  high:     { label: "HIGH",     color: "#D4A017", bg: "rgba(212,160,23,0.06)", min: 50, max: 75 },
  moderate: { label: "MODERATE", color: "#8B8B8B", bg: "rgba(139,139,139,0.04)", min: 25, max: 50 },
  fresh:    { label: "FRESH",    color: "#4B6A88", bg: "rgba(75,106,136,0.06)",  min: 0,  max: 25 },
};

export const ATR_ZONES_ORDERED: AtrZoneId[] = [
  "exceeded",
  "critical",
  "high",
  "moderate",
  "fresh",
];
