/**
 * Closed hashtag taxonomy. New tags must be added here first so they propagate
 * to the rephrase schema (zod enum) and the DB check constraint.
 */
export const HASHTAGS = [
  "monetary-policy",
  "interest-rates",
  "inflation",
  "economic-data",
  "central-banks",
  "fiscal-policy",
  "geopolitics",
  "risk-off",
  "risk-on",
  "safe-haven",
  "energy",
  "commodities",
  "precious-metals",
  "equities",
  "crypto",
  "forex",
  "bonds",
  "tech-sector",
  "earnings",
  "regulation",
  "us-politics",
  "volatility",
  "liquidity",
  "momentum",
] as const;

export type Hashtag = (typeof HASHTAGS)[number];

export const IMPACT_LEVELS = ["high", "medium", "low"] as const;
export type Impact = (typeof IMPACT_LEVELS)[number];

export const BIAS_LEVELS = ["bullish", "bearish", "neutral"] as const;
export type Bias = (typeof BIAS_LEVELS)[number];

export const NEWS_STATUSES = ["pending", "approved", "rejected"] as const;
export type NewsStatus = (typeof NEWS_STATUSES)[number];
