import { z } from "zod";
import { serverConfig } from "@/lib/config/server";
import { logger } from "@/lib/logger";

// Xendit uses a static x-callback-token header (NOT HMAC) — plain string equality check.
if (typeof window !== "undefined") {
  throw new Error(
    "[web] lib/payment/verify-xendit.ts imported from client bundle"
  );
}

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled";

type PaymentEventKind =
  | "checkout_completed"
  | "subscription_renewed"
  | "subscription_cancelled"
  | "payment_failed";

interface PaymentEvent {
  kind: PaymentEventKind;
  externalRef: string;
  profileId?: string;
  tier?: string;
  occurredAt: Date;
  raw: unknown;
}

interface VerifyWebhookInput {
  rawBody: string;
  headers: Record<string, string>;
}

type VerifyWebhookResult =
  | { valid: true; event: PaymentEvent }
  | {
      valid: false;
      reason: "not_configured" | "bad_token" | "bad_json" | "bad_payload";
    };

const InvoiceCallbackSchema = z.object({
  id: z.string().min(1),
  external_id: z.string().min(1),
  status: z.string().min(1),
  paid_at: z.string().optional(),
  updated: z.string().optional(),
  created: z.string().optional(),
  description: z.string().optional(),
  payer_email: z.string().optional(),
  amount: z.number().optional(),
  metadata: z
    .object({
      profile_id: z.string().optional(),
      tier: z.string().optional(),
    })
    .partial()
    .optional(),
});

type InvoiceCallback = z.infer<typeof InvoiceCallbackSchema>;

function mapStatus(externalStatus: string): PaymentStatus {
  switch (externalStatus.toUpperCase()) {
    case "PAID":
      return "paid";
    case "PENDING":
      return "pending";
    case "EXPIRED":
    case "STOPPED":
      return "cancelled";
    case "FAILED":
      return "failed";
    default:
      return "pending";
  }
}

function statusToEventKind(status: PaymentStatus): PaymentEventKind {
  switch (status) {
    case "paid":
      return "checkout_completed";
    case "failed":
      return "payment_failed";
    case "cancelled":
    case "refunded":
      return "subscription_cancelled";
    case "pending":
    default:
      return "checkout_completed";
  }
}

function occurredAtOf(cb: InvoiceCallback): Date {
  const candidate = cb.paid_at ?? cb.updated ?? cb.created;
  if (candidate) {
    const d = new Date(candidate);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

export function verifyXenditWebhook(
  input: VerifyWebhookInput
): VerifyWebhookResult {
  const expected = serverConfig.XENDIT_WEBHOOK_TOKEN;
  if (!expected) {
    return { valid: false, reason: "not_configured" };
  }

  const received = input.headers["x-callback-token"];
  if (!received || received !== expected) {
    return { valid: false, reason: "bad_token" };
  }

  let json: unknown;
  try {
    json = JSON.parse(input.rawBody);
  } catch (err) {
    logger.warn("xendit webhook: bad JSON body", {
      error: err,
      scope: "payment.xendit.verify",
    });
    return { valid: false, reason: "bad_json" };
  }

  const parsed = InvoiceCallbackSchema.safeParse(json);
  if (!parsed.success) {
    return { valid: false, reason: "bad_payload" };
  }

  const cb = parsed.data;
  const status = mapStatus(cb.status);
  const event: PaymentEvent = {
    kind: statusToEventKind(status),
    externalRef: cb.id,
    profileId: cb.metadata?.profile_id,
    tier: cb.metadata?.tier,
    occurredAt: occurredAtOf(cb),
    raw: cb,
  };

  return { valid: true, event };
}
