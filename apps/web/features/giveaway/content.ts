// BingX partner registration link (TradeVantage referral).
export const BINGX_REF_URL =
  "https://bingx.com/id/activity/general/3013891856?ch=bd&ref=TradeVantage";

export const REWARDS = [
  { value: "20 USDT", label: "Position voucher on register" },
  { value: "8 USDT", label: "Cash for trading 2 days" },
  { value: "$100", label: "Weekly giveaway, drawn Saturday" },
] as const;

export const STEPS = [
  {
    n: "01",
    title: "Register on BingX",
    body: "Sign up through the TradeVantage link and get a 20 USDT position voucher.",
  },
  {
    n: "02",
    title: "KYC + deposit, trade 500 USDT",
    body: "Complete KYC, deposit, and trade 500 USDT to earn 3 USDT cash.",
  },
  {
    n: "03",
    title: "Submit your BingX User ID",
    body: "Enter your UID below to join the $100 weekly giveaway. Winners are drawn every Saturday.",
  },
] as const;
