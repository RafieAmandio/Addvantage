import { BF_BCA_PRICE_IDR, BF_FULL_PRICE_USD, EARLY_ACCESS_PRICE } from "@tradevantage/shared/schema";

// The struck price is apply's normal early-access USDT price, so the two never drift apart.
export const WAS_PRICE = `$${EARLY_ACCESS_PRICE.usdt.amount}`;
export const NOW_PRICE = `$${BF_FULL_PRICE_USD}`;
import { PAYMENT_DESTINATIONS } from "@/features/early-access/content";

// Stepper labels (index === step). The done screen sits after the last one.
export const STEPS = [
  { n: "01", label: "Identity" },
  { n: "02", label: "Questions" },
  { n: "03", label: "BingX" },
  { n: "04", label: "Plan" },
  { n: "05", label: "Waiver" },
] as const;

export const BINGX = {
  code: "TRADEVANTAGE",
  url: "https://bingx.com/id/partner/TradeVantage",
} as const;

export const EXPERIENCE_OPTIONS = [
  { value: "lt1", label: "Under 1 year" },
  { value: "1-3", label: "1 to 3 years" },
  { value: "3-5", label: "3 to 5 years" },
  { value: "5+", label: "5 years or more" },
] as const;

export const MARKET_OPTIONS = [
  { value: "forex", label: "Forex" },
  { value: "indices", label: "Indices" },
  { value: "commodities", label: "Commodities" },
  { value: "crypto", label: "Crypto" },
  { value: "stocks", label: "Stocks" },
] as const;

export const POSITION_OPTIONS = [
  { value: "lt1k", label: "Under $1,000" },
  { value: "1k-10k", label: "$1,000 to $10,000" },
  { value: "10k-100k", label: "$10,000 to $100,000" },
  { value: "100k+", label: "Over $100,000" },
] as const;

export const PLANS = {
  free: {
    n: "00",
    name: "Free account",
    price: "$0",
    term: "No payment",
    lines: ["Token Unlocks radar", "Upgrade Radar", "The news desk"],
  },
  full: {
    n: "01",
    name: "Full access",
    price: NOW_PRICE,
    was: WAS_PRICE,
    term: "One year of VIP+ Trader",
    lines: ["Everything on the desk for 1 year", "Trading plans and 1v1 consults", "Forex tools, calendar, education"],
    dinner: "Full access members get a chance to be invited to an exclusive dinner sponsored by BingX. 10 seats.",
  },
} as const;

export interface Destination {
  method: string;
  amountLabel: string;
  rows: readonly { label: string; value: string; copyable?: boolean }[];
  note: string;
}

// Same wallet as apply; only the amount differs.
export const USDT_DESTINATION: Destination = {
  method: "USDT, TRC20",
  amountLabel: `$${BF_FULL_PRICE_USD} USDT`,
  rows: PAYMENT_DESTINATIONS.usdt.rows,
  note: "Send the exact amount on the TRC20 network, then upload your transfer receipt below.",
};

// Shown only when an IDR price is set in BF_BCA_PRICE_IDR.
export const BCA_DESTINATION: Destination | null =
  BF_BCA_PRICE_IDR == null
    ? null
    : {
        method: "Bank transfer, BCA",
        amountLabel: `IDR ${BF_BCA_PRICE_IDR.toLocaleString("en-US")}`,
        rows: PAYMENT_DESTINATIONS.bca.rows,
        note: "Transfer the exact amount, then upload your transfer receipt below.",
      };

/**
 * The promo's own terms, signed in the waiver step right after apply's four acknowledgements and
 * stored with them in `acknowledgements`. Only promo facts; apply has no refund clause, so neither does this.
 */
export const PROMO_ACKS = {
  review: "Every application is reviewed by the desk. Access starts only once mine is approved, on the free plan and on Full access alike.",
  scope: {
    free: "The free account opens Token Unlocks, Upgrade Radar and the news desk. The rest of the desk needs VIP+ Trader.",
    full: "Full access is VIP+ Trader for 1 year, counted from the day my application is approved.",
  },
  dinner:
    "The BingX dinner is a chance to be invited, at the desk's discretion, for 10 seats sponsored by BingX. It is an invitation the desk may extend, not something I win or am owed.",
} as const;
