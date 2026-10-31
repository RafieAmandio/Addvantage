import type { Impact } from "@/features/calendar/types";

export const IMPACT_LABEL: Record<Impact, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

/** Text colour per impact: high is the one thing worth the brand colour. */
export const IMPACT_TEXT: Record<Impact, string> = {
  high: "text-brand",
  medium: "text-white/55",
  low: "text-white/30",
};

export const IMPACT_DOT: Record<Impact, string> = {
  high: "bg-brand",
  medium: "bg-white/55",
  low: "bg-white/20",
};

export const MAX_EVENTS_IN_CELL = 3;
