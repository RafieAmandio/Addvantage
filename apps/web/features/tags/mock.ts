import type { Hashtag } from "@/lib/mock/types";

export const hashtagMeta: Record<Hashtag, { label: string; description: string }> = {
  "losing-streak": {
    label: "Losing Streak",
    description: "Process for surviving and exiting drawdown without doing more damage.",
  },
  unprofitability: {
    label: "Unprofitability",
    description: "Diagnosing why an edge isn't there yet — sample size, filter, execution.",
  },
  "developing-edge": {
    label: "Developing Edge",
    description: "Building, testing, and trusting a new system.",
  },
  "loss-aversion": {
    label: "Loss Aversion",
    description: "Asymmetric pain from losses vs. pleasure from gains. The root of disposition effect.",
  },
  "recency-bias": {
    label: "Recency Bias",
    description: "Weighting the last few trades more than the previous many.",
  },
  "sunk-cost": {
    label: "Sunk Cost",
    description: "Refusing to close a trade because of money already lost on it.",
  },
  "risk-management": {
    label: "Risk Management",
    description: "Position sizing, invalidation, drawdown protocol.",
  },
  "mean-reversion": {
    label: "Mean Reversion",
    description: "Setups built on extension and snap-back.",
  },
  "trend-following": {
    label: "Trend Following",
    description: "Setups built on continuation and breakout.",
  },
};

export const allHashtags: Hashtag[] = Object.keys(hashtagMeta) as Hashtag[];
