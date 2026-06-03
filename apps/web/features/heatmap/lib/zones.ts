import type { RsiZoneId } from "../types";
import type { ForexGroup } from "@tradevantage/shared";

export const GROUP_LABELS: Record<string, string> = {
  major: "Major",
  cross: "Cross",
  commodity: "Commodity",
  exotic: "Exotic",
  index: "Index",
};

export const GROUP_COLORS: Record<ForexGroup, string> = {
  major: "#FFD400",
  cross: "rgba(255,255,255,0.5)",
  commodity: "#FACC15",
  exotic: "#A855F7",
  index: "#3B82F6",
};

export const GROUPS_ORDERED: ForexGroup[] = ["major", "cross", "commodity", "index", "exotic"];

export const ZONE_CONFIG: Record<
  RsiZoneId,
  { label: string; color: string; bg: string; min: number; max: number }
> = {
  overbought: { label: "OVERBOUGHT", color: "#E03C3C", bg: "rgba(224,60,60,0.08)", min: 70, max: 100 },
  strong:     { label: "STRONG",     color: "#ef5350", bg: "rgba(224,60,60,0.04)", min: 60, max: 70 },
  neutral:    { label: "NEUTRAL",    color: "#6B7280", bg: "transparent",          min: 40, max: 60 },
  weak:       { label: "WEAK",       color: "#65A30D", bg: "rgba(101,163,13,0.04)", min: 30, max: 40 },
  oversold:   { label: "OVERSOLD",   color: "#22c55e", bg: "rgba(101,163,13,0.08)", min: 0,  max: 30 },
};

export const ZONES_ORDERED: RsiZoneId[] = ["overbought", "strong", "neutral", "weak", "oversold"];
