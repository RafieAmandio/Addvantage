import { HASHTAGS, type Hashtag } from "@tradevantage/shared";

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
  fomo: {
    label: "FOMO",
    description: "Chasing a move already underway for fear of missing out, not on a planned signal.",
  },
  overtrading: {
    label: "Overtrading",
    description: "Taking too many trades relative to real edge — boredom, noise, or forcing setups.",
  },
  "revenge-trading": {
    label: "Revenge Trading",
    description: "Trading to win back a recent loss rather than following the plan.",
  },
  patience: {
    label: "Patience",
    description: "Waiting for the setup to come to you instead of manufacturing one.",
  },
  discipline: {
    label: "Discipline",
    description: "Executing the plan consistently regardless of how you feel in the moment.",
  },
  breakout: {
    label: "Breakout",
    description: "Entries on price clearing a defined level or range with momentum.",
  },
  liquidity: {
    label: "Liquidity",
    description: "Reading where resting orders and stops sit, and how price hunts them.",
  },
  "support-resistance": {
    label: "Support / Resistance",
    description: "Trading reactions at horizontal levels where price has previously turned.",
  },
  volatility: {
    label: "Volatility",
    description: "Sizing and setups adapted to how much the instrument is currently moving.",
  },
  "position-sizing": {
    label: "Position Sizing",
    description: "Choosing trade size from risk-per-trade and stop distance, not gut feel.",
  },
  confluence: {
    label: "Confluence",
    description: "Stacking multiple independent signals that agree before entering.",
  },
  fakeout: {
    label: "Fakeout",
    description: "A false break that traps traders on the wrong side before reversing.",
  },
  momentum: {
    label: "Momentum",
    description: "Trading in the direction of strong, sustained order flow.",
  },
  "range-bound": {
    label: "Range Bound",
    description: "Fading the edges of a market with no clear directional trend.",
  },
  "news-driven": {
    label: "News Driven",
    description: "Moves caused by scheduled data or headlines rather than pure price action.",
  },
  overconfidence: {
    label: "Overconfidence",
    description: "Oversizing or skipping rules after a run of wins.",
  },
  "analysis-paralysis": {
    label: "Analysis Paralysis",
    description: "Over-researching to the point of missing or avoiding execution.",
  },
};

export const allHashtags: Hashtag[] = [...HASHTAGS];
