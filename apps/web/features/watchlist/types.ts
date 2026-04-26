import type { NewsListItem } from "@/features/news/queries/news";
import type { TradingPlan, TradingSetup } from "@/features/plan/types";

export interface TickerRollup {
  ticker: string;
  newsItems: NewsListItem[];
  liveSetups: Array<{ plan: TradingPlan; setup: TradingSetup }>;
  archiveSetups: Array<{ plan: TradingPlan; setup: TradingSetup }>;
  totalR: number;
  closedCount: number;
}

export type SortMode = "pinned" | "news" | "r" | "alpha";
