import type { Impact } from "@/lib/mock/types";

export const IMPACT_LABEL: Record<Impact, string> = {
  high: "High",
  medium: "Mod",
  low: "Low",
};

export const IMPACT_STYLE: Record<Impact, string> = {
  high: "border-blood/60 bg-blood/20 text-[#fda4af]",
  medium: "border-brand/60 bg-brand/10 text-brand",
  low: "border-moss/60 bg-moss/10 text-moss",
};

export const IMPACT_DOT: Record<Impact, string> = {
  high: "bg-[#991b1b] border-[#fda4af]",
  medium: "bg-brand border-brand",
  low: "bg-moss border-moss",
};

export const MAX_EVENTS_IN_CELL = 3;

export function scoreStyle(n: number): string {
  if (n >= 9) return "bg-[#7f1d1d] text-[#fecaca]";
  if (n >= 8) return "bg-[#991b1b] text-[#fee2e2]";
  if (n >= 7) return "bg-[#b45309] text-[#fef3c7]";
  if (n >= 6) return "bg-[#b45309]/80 text-[#fef3c7]";
  if (n >= 5) return "bg-[#78350f] text-[#fef3c7]";
  if (n >= 4) return "bg-[#57330a] text-[#f5d478]";
  if (n >= 3) return "bg-[#3f6212] text-[#d9f99d]";
  if (n >= 2) return "bg-[#365314] text-[#d9f99d]";
  return "bg-[#1a2e05] text-[#a3e635]";
}
