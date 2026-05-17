import type { Request } from "express";
import { z } from "zod";
import { env } from "@/config/env.js";
import type {
  PaymentProvider,
  PaymentEvent,
  VerifyResult,
  CreateInvoiceOpts,
  InvoiceResult,
} from "../../types.js";
import { InvoiceCallbackSchema, type InvoiceCallback } from "./types.js";

type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";

const XENDIT_BASE = "https://api.xendit.co";

const CreateInvoiceResponseSchema = z.object({
  id: z.string().min(1),
  invoice_url: z.string().url(),
  status: z.string(),
  expiry_date: z.string().optional(),
});

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
      externalRef: cb.external_id,
      profileId: cb.metadata?.profile_id,
      tier: cb.metadata?.tier,
      occurredAt: occurredAtOf(cb),
      raw: cb,
    };

    return { valid: true, event };
  }

  async createInvoice(opts: CreateInvoiceOpts): Promise<InvoiceResult> {
    const secretKey = env.XENDIT_SECRET_KEY;
    if (!secretKey) {
      throw new Error("XENDIT_SECRET_KEY is not configured");
    }

    const body: Record<string, unknown> = {
      external_id: opts.externalRef,
      amount: opts.amount,
      currency: opts.currency,
      description: opts.description,
      payer_email: opts.payerEmail,
      should_send_email: true,
    };

    if (opts.metadata) body.metadata = opts.metadata;
    if (opts.successRedirectUrl) body.success_redirect_url = opts.successRedirectUrl;
    if (opts.failureRedirectUrl) body.failure_redirect_url = opts.failureRedirectUrl;

    const auth = Buffer.from(`${secretKey}:`).toString("base64");

    const res = await fetch(`${XENDIT_BASE}/v2/invoices`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`xendit: HTTP ${res.status} ${res.statusText} ${text}`);
    }

    const raw = (await res.json()) as unknown;
    const parsed = CreateInvoiceResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`xendit: unexpected response: ${parsed.error.message}`);
    }

    return {
      externalId: parsed.data.id,
      invoiceUrl: parsed.data.invoice_url,
      status: parsed.data.status,
      expiresAt: parsed.data.expiry_date ? new Date(parsed.data.expiry_date) : undefined,
    };
  }
}
