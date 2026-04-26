export interface NewsItem {
  id: string;
  ts: string;
  author: string;
  headline: string;
  impact: "high" | "medium" | "low";
  bias: "bullish" | "bearish" | "neutral";
  affects: string[];
  analysis: string;
  tags: string[];
  relatedPlanIds?: string[];
}
