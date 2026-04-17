import type { news } from "@/features/news/mock";
import type { CalendarEvent, TradingPlan, TradingSetup } from "@/lib/mock/types";

export interface TickerRollup {
  ticker: string;
  newsItems: typeof news;
  liveSetups: Array<{ plan: TradingPlan; setup: TradingSetup }>;
  archiveSetups: Array<{ plan: TradingPlan; setup: TradingSetup }>;
  calendarEvents: CalendarEvent[];
  totalR: number;
  closedCount: number;
}

export type SortMode = "pinned" | "news" | "r" | "alpha";
