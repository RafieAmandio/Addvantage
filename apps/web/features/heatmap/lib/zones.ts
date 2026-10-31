import type { RsiZoneId } from "../types";
import type { ForexGroup } from "@tradevantage/shared";

export const GROUP_LABELS: Record<string, string> = {
  major: "Major",
  cross: "Cross",
  commodity: "Commodity",
  index: "Index",
};

export const GROUP_COLORS: Record<ForexGroup, string> = {
  major: "#FFD400",
  cross: "rgba(255,255,255,0.5)",
  commodity: "#FACC15",
  index: "#3B82F6",
};

export const GROUPS_ORDERED: ForexGroup[] = ["major", "cross", "commodity", "index"];

export const ZONE_CONFIG: Record<
  RsiZoneId,
  { label: string; color: string; bg: string; min: number; max: number }
> = {
  overbought: { label: "Overbought", color: "#FF454D", bg: "rgba(255,69,77,0.08)", min: 70, max: 100 },
  strong:     { label: "Strong",     color: "rgba(255,69,77,0.65)", bg: "rgba(255,69,77,0.04)", min: 60, max: 70 },
  neutral:    { label: "Neutral",    color: "rgba(255,255,255,0.55)", bg: "transparent", min: 40, max: 60 },
  weak:       { label: "Weak",       color: "rgba(0,221,148,0.65)", bg: "rgba(0,221,148,0.04)", min: 30, max: 40 },
  oversold:   { label: "Oversold",   color: "#00DD94", bg: "rgba(0,221,148,0.08)", min: 0,  max: 30 },
};

export const ZONES_ORDERED: RsiZoneId[] = ["overbought", "strong", "neutral", "weak", "oversold"];
