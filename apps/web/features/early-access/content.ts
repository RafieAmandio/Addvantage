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

// Fixed partner brokers (affiliate links from referral_partners). Register now
// or later; cashback participants are verified after one week.
export interface PartnerBroker {
  name: string;
  kind: string;
  url: string;
  logoUrl?: string;
}

export const PARTNER_BROKERS: PartnerBroker[] = [
  {
    name: "Exness",
    kind: "Forex and CFD broker",
    url: "https://one.exnessonelink.com/a/ln6atwo69p",
    logoUrl:
      "https://mlbcppehtoytqqbrkirn.supabase.co/storage/v1/object/public/uploads/referral/314d500c-6821-44a7-8b24-5936266116cd.webp",
  },
  {
    name: "Bitget",
    kind: "Crypto exchange",
    url: "https://partner.bitget.com/bg/TVantage",
    logoUrl:
      "https://mlbcppehtoytqqbrkirn.supabase.co/storage/v1/object/public/uploads/referral/399281be-842e-40de-929a-49dd65fc873c.png",
  },
];

export const BROKER_COPY =
  "Register with a partner broker now or later. If you take the cashback program, we verify your account after one week.";

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
      { label: "Network", value: "TRC20 (Tron)" },
      { label: "Wallet address", value: "TL2sphSJFtRkS1CHbRhBRLBL7utxHkKo7T", copyable: true },
    ],
    note: "Cheapest option. Send the exact amount on the TRC20 network, then upload your transfer receipt below.",
  },
  bca: {
    method: "Bank transfer (BCA)",
    amountLabel: "IDR 18,000,000",
    rows: [
      { label: "Bank", value: "BCA" },
      { label: "Account name", value: "VANTAGE ALGORITMA INDONESIA" },
      { label: "Account number", value: "7350368021", copyable: true },
    ],
    note: "Transfer the exact amount, then upload your transfer receipt below.",
  },
} as const;

// Success screen + confirmation email share this framing.
export const CONFIRMATION = {
  bonusMonths: 2,
  subscriptionStart: "Monday, 13 July 2026",
  freeThrough: "30 September 2026",
  subscriptionThrough: "30 September 2027",
  accessEmailDate: "Monday, 13 July 2026",
} as const;
