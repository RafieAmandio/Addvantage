import type { TradingPlan } from "@/lib/mock/types";

export type HorizonFilter = "all" | TradingPlan["horizon"];

export type HorizonRBreakdown = Record<
  TradingPlan["horizon"],
  { r: number; n: number }
>;

export type PlanMonthGroup = {
  ym: string;
  label: string;
  plans: TradingPlan[];
};
