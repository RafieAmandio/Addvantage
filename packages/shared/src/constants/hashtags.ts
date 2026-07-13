/**
 * Closed hashtag taxonomy. New tags must be added here first so they propagate
 * to the rephrase schema (zod enum) and the DB check constraint.
 */
export const HASHTAGS = [
  "losing-streak",
  "unprofitability",
  "developing-edge",
  "loss-aversion",
  "recency-bias",
  "sunk-cost",
  "risk-management",
  "mean-reversion",
  "trend-following",
  "fomo",
  "overtrading",
  "revenge-trading",
  "patience",
  "discipline",
  "breakout",
  "liquidity",
  "support-resistance",
  "volatility",
  "position-sizing",
  "confluence",
  "fakeout",
  "momentum",
  "range-bound",
  "news-driven",
  "overconfidence",
  "analysis-paralysis",
] as const;

export type Hashtag = (typeof HASHTAGS)[number];

export const IMPACT_LEVELS = ["high", "medium", "low"] as const;
export type Impact = (typeof IMPACT_LEVELS)[number];

export const BIAS_LEVELS = ["bullish", "bearish", "neutral"] as const;
export type Bias = (typeof BIAS_LEVELS)[number];

export const NEWS_STATUSES = ["pending", "approved", "rejected"] as const;
export type NewsStatus = (typeof NEWS_STATUSES)[number];
