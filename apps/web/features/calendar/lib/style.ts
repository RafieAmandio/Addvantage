import type { Impact } from "@/features/calendar/types";

export const IMPACT_LABEL: Record<Impact, string> = {
  high: "High",
  medium: "Mid",
  low: "Low",
};

export const IMPACT_STYLE: Record<Impact, string> = {
  high: "border-blood/60 bg-blood/20 text-blood-text",
  medium: "border-brand/60 bg-brand/10 text-brand",
  low: "border-moss/60 bg-moss/10 text-moss",
};

export const IMPACT_DOT: Record<Impact, string> = {
  high: "bg-blood border-blood-text",
  medium: "bg-brand border-brand",
  low: "bg-moss border-moss",
};

export const MAX_EVENTS_IN_CELL = 3;
