import { z } from "zod";

/**
 * Early-access / cashback intake — the single source of truth for the
 * application payload, imported by both the web server action and the API
 * validation layer. Monetary amounts are NOT accepted from the client; the API
 * derives them from `paymentMethod` (see EARLY_ACCESS_PRICE) so they can't be
 * tampered with.
 */

export const PAYMENT_METHODS = ["usdt", "bca"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Server-authoritative price per method. */
export const EARLY_ACCESS_PRICE: Record<
  PaymentMethod,
  { amount: number; currency: string }
> = {
  usdt: { amount: 850, currency: "USDT" },
  bca: { amount: 18_000_000, currency: "IDR" },
};

/** The four acknowledgements the applicant must tick before signing. */
export const ACK_KEYS = ["risk", "ownResearch", "noGuarantee", "terms"] as const;
export type AckKey = (typeof ACK_KEYS)[number];

// Full legal name: same rule as the existing liability waiver — at least two
// words, letters plus spaces/hyphens/apostrophes/periods only.
const fullName = z
  .string()
  .trim()
  .min(5, "Enter your full legal name")
  .regex(/^[\p{L}\s.'-]+$/u, "Letters, spaces, hyphens and apostrophes only")
  .refine((v) => /\s/.test(v), "Enter your first and last name");

// Telegram handle: strip a leading @, then letters/numbers/underscore, 5..64.
const telegramHandle = z
  .string()
  .trim()
  .transform((v) => v.replace(/^@+/, ""))
  .pipe(
    z
      .string()
      .min(3, "Enter your Telegram handle")
      .max(64)
      .regex(/^[A-Za-z0-9_]+$/, "Letters, numbers and underscores only"),
  );

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(max).optional(),
  );

const acknowledgements = z.object({
  risk: z.literal(true),
  ownResearch: z.literal(true),
  noGuarantee: z.literal(true),
  terms: z.literal(true),
});

const email = z.string().trim().toLowerCase().email("Enter a valid email");

// Captured the moment the identity step is completed, persisted as a draft so
// the team has a follow-up record even if the flow is abandoned.
export const EarlyAccessLeadSchema = z.object({
  email,
  telegramHandle,
});

export type EarlyAccessLeadInput = z.infer<typeof EarlyAccessLeadSchema>;

export const EarlyAccessApplicationSchema = z.object({
  email,
  telegramHandle,
  wantsCashback: z.boolean(),
  broker: optionalText(80),
  brokerAccountRef: optionalText(120),
  signedName: fullName,
  acknowledgements,
  paymentMethod: z.enum(PAYMENT_METHODS),
  // Proof lives in the private `payment-proofs` bucket, so the upload endpoint
  // hands back an object key (e.g. "payment-proof/<uuid>.png"), not a public
  // URL. Accept any non-empty reference; the value is server-derived from our
  // own upload endpoint, never free user input.
  proofImageUrl: z
    .string()
    .trim()
    .min(1, "Upload your payment proof")
    .max(500),
  // Honeypot: real users never fill this; bots do. Must be empty/absent.
  website: z.string().max(0).optional(),
});

export type EarlyAccessApplicationInput = z.infer<
  typeof EarlyAccessApplicationSchema
>;
