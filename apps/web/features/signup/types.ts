// Feature-local types + closed-set option arrays for the trader profile wizard.
// Kept as a leaf module so both client components and the hook can import from
// it without pulling server-only code into the client bundle.

export type ProfileForm = {
  tradingLength: string;
  longestProfitable: string;
  markets: string[];
  yearlyGoal: string;
  faultAttribution: string;
};

export const TRADING_LENGTHS = [
  { value: "<1", label: "Less than 1 year" },
  { value: "1-3", label: "1 — 3 years" },
  { value: "3-5", label: "3 — 5 years" },
  { value: "5+", label: "5+ years" },
] as const;

export const PROFITABLE_PERIODS = [
  { value: "1week", label: "1 week" },
  { value: "1month", label: "1 month" },
  { value: "1year", label: "1 year" },
  { value: "3year+", label: "3 years+" },
] as const;

export const MARKETS = [
  { value: "indo", label: "Indonesian market" },
  { value: "crypto", label: "Crypto" },
  { value: "forex", label: "Forex" },
  { value: "us", label: "US markets" },
] as const;

export const FAULT_OPTIONS = [
  {
    value: "vantage",
    label: "Vantage's fault",
    desc: "The analyst gave me the idea. They should have been right.",
  },
  {
    value: "me",
    label: "My fault",
    desc: "I chose to take the trade. The decision was mine.",
  },
  {
    value: "market",
    label: "The market's fault",
    desc: "Nobody could have predicted that move. It was random.",
  },
] as const;
