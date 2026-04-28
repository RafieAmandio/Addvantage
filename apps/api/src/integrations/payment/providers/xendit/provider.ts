import type { Request } from "express";
import { env } from "@/config/env.js";
import type { PaymentProvider, PaymentEvent, VerifyResult } from "../../types.js";
import { InvoiceCallbackSchema, type InvoiceCallback } from "./types.js";

type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";

function mapStatus(externalStatus: string): PaymentStatus {
  switch (externalStatus.toUpperCase()) {
    case "PAID": return "paid";
    case "PENDING": return "pending";
    case "EXPIRED":
    case "STOPPED": return "cancelled";
    case "FAILED": return "failed";
    default: return "pending";
  }
}

function statusToEventKind(status: PaymentStatus): PaymentEvent["kind"] {
  switch (status) {
    case "paid": return "checkout_completed";
    case "failed": return "payment_failed";
    case "cancelled":
    case "refunded": return "subscription_cancelled";
    case "pending":
    default: return "checkout_completed";
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

export class XenditProvider implements PaymentProvider {
  name = "xendit" as const;

  verifyWebhook(req: Request): VerifyResult {
    const expected = env.XENDIT_WEBHOOK_TOKEN;
    if (!expected) {
      return { valid: false, reason: "not_configured" };
    }

    const received = req.headers["x-callback-token"];
    if (!received || received !== expected) {
      return { valid: false, reason: "bad_token" };
    }

    const parsed = InvoiceCallbackSchema.safeParse(req.body);
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
}
