// BingX partner registration link (TradeVantage referral).
export const BINGX_REF_URL =
  "https://bingx.com/id/activity/general/3013891856?ch=bd&ref=TradeVantage";

// Guide: move KYC identity from an old BingX account to a new one (under the referral).
export const BINGX_KYC_TRANSFER_URL =
  "https://bingx.com/id/support/articles/20877072634265-caramentransferidentitasandakeakunlain";

// Support contact for member questions.
export const SUPPORT_TELEGRAM = "@p4thfinder11";
export const SUPPORT_TELEGRAM_URL = "https://t.me/p4thfinder11";

export const REWARDS = [
  { value: "20 USDT", label: "Position voucher on register" },
  { value: "8 USDT", label: "Cash for trading 2 days" },
  { value: "$100", label: "Giveaway prize" },
] as const;

export const STEPS = [
  {
    n: "01",
    title: "Register on BingX",
    body: "Sign up through the TradeVantage link and get a 20 USDT position voucher.",
  },
  {
    n: "02",
    title: "KYC + deposit, then trade",
    body: "Complete KYC, deposit, and trade for 2 days to earn 8 USDT cash.",
  },
  {
    n: "03",
    title: "Submit your BingX User ID",
    body: "Enter your UID below to join the $100 giveaway.",
  },
] as const;
