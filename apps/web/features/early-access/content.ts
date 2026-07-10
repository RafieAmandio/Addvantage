import type { AckKey } from "@tradevantage/shared/schema";

// Stepper labels (index === step).
export const STEPS = [
  { n: "01", label: "Identity" },
  { n: "02", label: "Cashback" },
  { n: "03", label: "Waiver" },
  { n: "04", label: "Payment" },
] as const;

// Liability acknowledgements — every applicant signs these, cashback or not.
export const ACK_ITEMS: { key: AckKey; label: string }[] = [
  {
    key: "risk",
    label:
      "I understand trading carries substantial risk of loss, including my entire principal.",
  },
  {
    key: "ownResearch",
    label:
      "I will do my own due diligence on any partner broker before funding an account.",
  },
  {
    key: "noGuarantee",
    label:
      "TradeVantage provides intelligence, not investment advice, and guarantees no profit. I act on my own responsibility.",
  },
  {
    key: "terms",
    label:
      "I release TradeVantage and its affiliates from liability for my trading outcomes.",
  },
];

// Optional broker attribution (supports the manual affiliate check).
export const BROKER_OPTIONS = ["Exness", "Bitget", "Bybit", "Other", "None yet"] as const;

// The cashback briefing, shown when the applicant opts in. De-em-dashed.
export const CASHBACK = {
  headline: "100% money-back guarantee, in USDT, after one year.",
  qualify: [
    "Sign up and trade with one of our selected partner brokers (to be confirmed).",
    "Post every trade in the private chat on our website before you execute it. This is your journal and your accountability.",
    "Your posted trades do not have to be profitable. You only have to never miss posting one.",
  ],
  close:
    "Stay disciplined and act like a professional, and we reward it, with proof we can double-check against our partner brokers. Already have an account with one of them? We can help switch your partner code.",
} as const;

// Manual payment destinations. Wallet + account are filled in when provided.
export const PAYMENT_DESTINATIONS = {
  usdt: {
    method: "USDT",
    amountLabel: "$850 USDT",
    rows: [
      { label: "Network", value: "TRC20 (to be confirmed)" },
      { label: "Wallet address", value: "PROVIDED_ON_LAUNCH", copyable: true },
    ],
    note: "Cheapest option. Send the exact amount, then upload your transfer receipt below.",
  },
  bca: {
    method: "Bank transfer (BCA)",
    amountLabel: "IDR 18,000,000",
    rows: [
      { label: "Bank", value: "BCA" },
      { label: "Account name", value: "TradeVantage" },
      { label: "Account number", value: "PROVIDED_ON_LAUNCH", copyable: true },
    ],
    note: "Transfer the exact amount, then upload your transfer receipt below.",
  },
} as const;

// Success screen + confirmation email share this framing.
export const CONFIRMATION = {
  bonusMonths: 2,
  subscriptionStart: "30 September 2026",
  accessEmailDate: "Monday, 13 July 2026",
} as const;
