import type { TradingPlan, TradingSetup } from "@/lib/mock/types";

/**
 * Pairing of a (historical) trading plan and one setup within it that
 * touches a watched ticker. Rendered in the "Edge on your pins · archive"
 * surface on the dashboard.
 */
export interface WatchArchiveEntry {
  plan: TradingPlan;
  setup: TradingSetup;
}

export const OPERATOR_ID = "U-00417";
