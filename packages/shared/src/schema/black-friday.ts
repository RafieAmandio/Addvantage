import { z } from "zod";
import { applicantEmail, legalName, waiverAcknowledgements } from "./early-access";
import { bingxUidField } from "./giveaway";

/**
 * Black Friday intake (blackfriday.tradevantage.gg). Shared by the web server actions and the
 * API validation layer. Prices are server-derived from the plan and method, never taken from input.
 */

export const BF_PLANS = ["free", "full"] as const;
export type BfPlan = (typeof BF_PLANS)[number];

export const BF_STATUSES = ["draft", "submitted", "approved", "rejected", "provisioned"] as const;
export type BfStatus = (typeof BF_STATUSES)[number];

export const BF_LOSS_CURRENCIES = ["USD", "IDR"] as const;
export type BfLossCurrency = (typeof BF_LOSS_CURRENCIES)[number];

// ponytail: fixed IDR per USD for normalising the loss answer; swap for a live FX rate if the buckets need precision.
export const BF_IDR_PER_USD = 16_000;

export const BF_FULL_PRICE_USD = 500;

// ponytail: set the IDR price to offer BCA transfer for Full access. null hides BCA entirely.
export const BF_BCA_PRICE_IDR: number | null = null;

export const BF_DINNER_SEATS = 10;

/** Server-authoritative price for Full access per payment method (BCA only when priced). */
export function bfPrice(method: "usdt" | "bca"): { amount: number; currency: string } | null {
  if (method === "usdt") return { amount: BF_FULL_PRICE_USD, currency: "USDT" };
  return BF_BCA_PRICE_IDR == null ? null : { amount: BF_BCA_PRICE_IDR, currency: "IDR" };
}

/** Biggest-loss answer in USD, rounded to cents. */
export function lossToUsd(amount: number, currency: BfLossCurrency): number {
  const usd = currency === "IDR" ? amount / BF_IDR_PER_USD : amount;
  return Math.round(usd * 100) / 100;
}

// Admin grouping by biggest loss in USD. `max` is exclusive.
export const BF_LOSS_BUCKETS = [
  { key: "lt1k", label: "Under $1k", min: 0, max: 1_000 },
  { key: "1k-10k", label: "$1k to $10k", min: 1_000, max: 10_000 },
  { key: "10k-50k", label: "$10k to $50k", min: 10_000, max: 50_000 },
  { key: "50k-100k", label: "$50k to $100k", min: 50_000, max: 100_000 },
  { key: "100k+", label: "$100k+", min: 100_000, max: Infinity },
] as const;
export type BfBucketKey = (typeof BF_LOSS_BUCKETS)[number]["key"];

export function lossBucket(usd: number): BfBucketKey {
  return BF_LOSS_BUCKETS.find((b) => usd < b.max)?.key ?? "100k+";
}

// Profiling questions. Apply asks none beyond identity, so these are the spec's three.
export const BF_EXPERIENCE = ["lt1", "1-3", "3-5", "5+"] as const;
export const BF_MARKETS = ["forex", "indices", "commodities", "crypto", "stocks"] as const;
export const BF_POSITION_SIZES = ["lt1k", "1k-10k", "10k-100k", "100k+"] as const;

const name = z.string().trim().min(2, "Enter your name").max(120);
// Telegram handle or WhatsApp number, free text.
const contact = z.string().trim().min(3, "Enter your Telegram or WhatsApp").max(120);
const proofKey = (msg: string) => z.string().trim().min(1, msg).max(500);

export const BlackFridayAnswersSchema = z.object({
  experience: z.enum(BF_EXPERIENCE),
  markets: z.array(z.enum(BF_MARKETS)).min(1, "Pick at least one market").max(BF_MARKETS.length),
  positionSize: z.enum(BF_POSITION_SIZES),
});
export type BlackFridayAnswers = z.infer<typeof BlackFridayAnswersSchema>;

/** Identity step, and again at the BingX step with the UID so a taken UID fails early. */
export const BlackFridayDraftSchema = z.object({
  email: applicantEmail,
  name,
  contact,
  bingxUid: bingxUidField.optional(),
});
export type BlackFridayDraftInput = z.infer<typeof BlackFridayDraftSchema>;

export const BlackFridayApplicationSchema = z
  .object({
    email: applicantEmail,
    name,
    contact,
    answers: BlackFridayAnswersSchema,
    biggestLossAmount: z.number().finite().min(0, "Enter 0 or more").max(1e12),
    biggestLossCurrency: z.enum(BF_LOSS_CURRENCIES),
    bingxUid: bingxUidField,
    bingxProofPath: proofKey("Upload your BingX screenshot"),
    plan: z.enum(BF_PLANS),
    paymentMethod: z.enum(["usdt", "bca"]).optional(),
    paymentProofPath: proofKey("Upload your transfer receipt").optional(),
    signedName: legalName,
    acknowledgements: waiverAcknowledgements,
    // Honeypot: real users never fill this; bots do.
    website: z.string().max(0).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.plan !== "full") return;
    if (!v.paymentMethod || !bfPrice(v.paymentMethod)) {
      ctx.addIssue({ code: "custom", path: ["paymentMethod"], message: "Choose a payment method" });
    }
    if (!v.paymentProofPath) {
      ctx.addIssue({ code: "custom", path: ["paymentProofPath"], message: "Upload your transfer receipt" });
    }
  });
export type BlackFridayApplicationInput = z.infer<typeof BlackFridayApplicationSchema>;

export const BlackFridayRejectSchema = z.object({ note: z.string().trim().max(500).optional() });
export const BlackFridayDinnerSchema = z.object({ invited: z.boolean() });

export const BF_APPROVED = ["approved", "provisioned"] as const;
const isApproved = (status: string) => (BF_APPROVED as readonly string[]).includes(status);

export interface BfSummaryRow {
  plan: string | null;
  status: string;
  biggestLossUsd: number;
  dinnerInvitedAt: Date | string | null;
}

/** The admin view: loss buckets (count, per plan, rows by loss desc) and the totals strip. */
export function summariseBlackFriday<T extends BfSummaryRow>(rows: T[], drafts = 0) {
  const groups = BF_LOSS_BUCKETS.map((b) => {
    const items = rows.filter((r) => lossBucket(r.biggestLossUsd) === b.key).sort((a, z) => z.biggestLossUsd - a.biggestLossUsd);
    return {
      key: b.key,
      label: b.label,
      count: items.length,
      byPlan: { free: items.filter((r) => r.plan === "free").length, full: items.filter((r) => r.plan === "full").length },
      items,
    };
  });
  const approvedFull = rows.filter((r) => r.plan === "full" && isApproved(r.status)).length;
  return {
    groups,
    totals: {
      applications: rows.length,
      drafts,
      free: rows.filter((r) => r.plan === "free").length,
      full: rows.filter((r) => r.plan === "full").length,
      pending: rows.filter((r) => r.status === "submitted").length,
      approved: rows.filter((r) => isApproved(r.status)).length,
      rejected: rows.filter((r) => r.status === "rejected").length,
      approvedFull,
      paidUsd: approvedFull * BF_FULL_PRICE_USD,
      dinnerInvited: rows.filter((r) => r.dinnerInvitedAt).length,
      dinnerSeats: BF_DINNER_SEATS,
    },
  };
}
