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

export function scoreStyle(n: number): string {
  if (n >= 9) return "bg-blood/80 text-blood-text";
  if (n >= 8) return "bg-blood/60 text-blood-text";
  if (n >= 7) return "bg-blood-bright/30 text-blood-text";
  if (n >= 6) return "bg-brand/30 text-brand";
  if (n >= 5) return "bg-brand/25 text-brand";
  if (n >= 4) return "bg-brand/15 text-brand";
  if (n >= 3) return "bg-moss/30 text-moss";
  if (n >= 2) return "bg-moss/20 text-moss";
  return "bg-moss/10 text-moss";
}
