import { HASHTAGS, type Hashtag } from "@tradevantage/shared";

export const hashtagMeta: Record<Hashtag, { label: string; description: string }> = {
  "monetary-policy": {
    label: "Monetary Policy",
    description: "Central-bank rate decisions, forward guidance, and QT/QE balance-sheet moves.",
  },
  "interest-rates": {
    label: "Interest Rates",
    description: "Policy and market rate moves, curve shape, and rate-cut/hike repricing.",
  },
  inflation: {
    label: "Inflation",
    description: "CPI, PCE, PPI prints, wage growth, and inflation-expectation shifts.",
  },
  "economic-data": {
    label: "Economic Data",
    description: "Growth, labor, and activity releases — NFP, GDP, PMIs, retail sales.",
  },
  "central-banks": {
    label: "Central Banks",
    description: "Fed, ECB, BoE, BoJ and peers — speeches, minutes, and personnel.",
  },
  "fiscal-policy": {
    label: "Fiscal Policy",
    description: "Government spending, taxation, deficits, debt issuance, and stimulus.",
  },
  geopolitics: {
    label: "Geopolitics",
    description: "Conflict, sanctions, trade tension, and elections that move risk pricing.",
  },
  "risk-off": {
    label: "Risk-Off",
    description: "Flight to safety — equities down, credit wider, defensive flows dominate.",
  },
  "risk-on": {
    label: "Risk-On",
    description: "Risk appetite building — equities bid, spreads tighten, carry rewarded.",
  },
  "safe-haven": {
    label: "Safe Haven",
    description: "Demand for gold, USD, JPY, CHF, and Treasuries in stress.",
  },
  energy: {
    label: "Energy",
    description: "Crude, natural gas, and refined products — supply, OPEC, and demand.",
  },
  commodities: {
    label: "Commodities",
    description: "Broad raw-materials complex — industrial metals, ags, and softs.",
  },
  "precious-metals": {
    label: "Precious Metals",
    description: "Gold, silver, platinum, palladium — haven bid and real-rate sensitivity.",
  },
  equities: {
    label: "Equities",
    description: "Stock indices and single names — positioning, breadth, and rotation.",
  },
  crypto: {
    label: "Crypto",
    description: "Bitcoin, Ether, and digital assets — flows, ETFs, and on-chain moves.",
  },
  forex: {
    label: "Forex",
    description: "Currency-pair moves, rate differentials, and cross-border capital flows.",
  },
  bonds: {
    label: "Bonds",
    description: "Sovereign and credit markets — yields, auctions, and spread moves.",
  },
  "tech-sector": {
    label: "Tech Sector",
    description: "AI, semiconductors, and megacap tech driving index leadership.",
  },
  earnings: {
    label: "Earnings",
    description: "Corporate results, guidance, and margins as market catalysts.",
  },
  regulation: {
    label: "Regulation",
    description: "Antitrust, financial rules, and policy actions reshaping sectors.",
  },
  "us-politics": {
    label: "US Politics",
    description: "Elections, Congress, shutdowns, and administration policy shifts.",
  },
  volatility: {
    label: "Volatility",
    description: "VIX regime, realized vs. implied swings, and volatility spikes.",
  },
  liquidity: {
    label: "Liquidity",
    description: "Market depth, funding conditions, and central-bank plumbing.",
  },
  momentum: {
    label: "Momentum",
    description: "Trend persistence and flow-driven continuation across assets.",
  },
};

export const allHashtags: Hashtag[] = [...HASHTAGS];

/**
 * Safe accessor for hashtag metadata. Returns the meta entry when present,
 * otherwise a derived fallback so the Explorer never crashes on a tag that
 * isn't in the current taxonomy (e.g. legacy tags on older news rows).
 */
export function getHashtagMeta(tag: string): { label: string; description: string } {
  const meta = (hashtagMeta as Record<string, { label: string; description: string }>)[tag];
  if (meta) return meta;
  return {
    label: tag.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    description: "",
  };
}
