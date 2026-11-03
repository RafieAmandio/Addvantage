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

export const BF_FULL_PRICE_USD = 500;

// ponytail: set the IDR price to offer BCA transfer for Full access. null hides BCA entirely.
export const BF_BCA_PRICE_IDR: number | null = null;

export const BF_DINNER_SEATS = 10;

/** Server-authoritative price for Full access per payment method (BCA only when priced). */
export function bfPrice(method: "usdt" | "bca"): { amount: number; currency: string } | null {
  if (method === "usdt") return { amount: BF_FULL_PRICE_USD, currency: "USDT" };
  return BF_BCA_PRICE_IDR == null ? null : { amount: BF_BCA_PRICE_IDR, currency: "IDR" };
}

// The biggest-loss answer is one of these buckets; the admin groups by it directly.
export const BF_LOSS_BUCKETS = [
  { key: "lt1k", label: "Under $1,000" },
  { key: "1k-10k", label: "$1,000 to $10,000" },
  { key: "10k-50k", label: "$10,000 to $50,000" },
  { key: "50k-100k", label: "$50,000 to $100,000" },
  { key: "100k+", label: "Over $100,000" },
] as const;
export const BF_LOSS_BUCKET_KEYS = ["lt1k", "1k-10k", "10k-50k", "50k-100k", "100k+"] as const;
export type BfBucketKey = (typeof BF_LOSS_BUCKET_KEYS)[number];

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
    biggestLossBucket: z.enum(BF_LOSS_BUCKET_KEYS),
    bingxUid: bingxUidField,
    bingxProofPath: proofKey("Upload your BingX screenshot"),
    plan: z.enum(BF_PLANS),
    paymentMethod: z.enum(["usdt", "bca"]).optional(),
    paymentProofPath: proofKey("Upload your transfer receipt").optional(),
    signedName: legalName,
    // Apply's four waiver acknowledgements plus the promo's own terms; `dinner` is required for Full.
    acknowledgements: waiverAcknowledgements.extend({
      review: z.literal(true),
      scope: z.literal(true),
      dinner: z.literal(true).optional(),
    }),
    // Honeypot: real users never fill this; bots do.
    website: z.string().max(0).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.plan !== "full") return;
    if (!v.acknowledgements.dinner) {
      ctx.addIssue({ code: "custom", path: ["acknowledgements", "dinner"], message: "Acknowledge the dinner terms" });
    }
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
  biggestLossBucket: string | null;
  dinnerInvitedAt: Date | string | null;
  createdAt: Date | string;
}

// Inside a loss group: pending review first, then newest.
const byReview = (a: BfSummaryRow, z: BfSummaryRow) =>
  Number(z.status === "submitted") - Number(a.status === "submitted") || new Date(z.createdAt).getTime() - new Date(a.createdAt).getTime();

/** The admin view: loss buckets (count, per plan, pending first then newest) and the totals strip. */
export function summariseBlackFriday<T extends BfSummaryRow>(rows: T[], drafts = 0) {
  const groups = BF_LOSS_BUCKETS.map((b) => {
    const items = rows.filter((r) => r.biggestLossBucket === b.key).sort(byReview);
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
