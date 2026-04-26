import type { TradingPlan, TradingSetup } from "@/features/plan/types";

export interface WatchArchiveEntry {
  plan: TradingPlan;
  setup: TradingSetup;
}

export const OPERATOR_ID = "U-00417";
