import { z } from "zod";
import { isPaidTier, TIERS, TIER_PRICE_IDR, type Tier } from "@tradevantage/shared";
import { config } from "../../lib/config";
import { logger } from "../../lib/logger";
import { retry } from "../../lib/retry";
import type {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
  PaymentAdapter,
  PaymentEvent,
  PaymentEventKind,
  PaymentStatus,
  VerifyWebhookInput,
  VerifyWebhookResult,
} from "./base";

/**
 * Xendit payment adapter — hosted-checkout via Invoices API.
 *
 * Docs:
 *   - Create invoice: https://developers.xendit.co/api-reference/#create-invoice
 *   - Invoice callbacks: https://developers.xendit.co/api-reference/#invoice-callback
 *
 * Auth: HTTP Basic with the secret key as username and an empty password.
 *
 * Webhook security: Xendit uses a *static* `x-callback-token` header (NOT an
 * HMAC of the body). The token is configured in the Xendit dashboard; we
 * mirror it into `XENDIT_WEBHOOK_TOKEN` and compare on every delivery.
 * Signature verification therefore reduces to a string equality check; we
 * still parse the body with Zod so downstream consumers get a typed event.
 *
 * Status mapping:
 *   PAID              → paid
 *   PENDING           → pending
 *   EXPIRED, STOPPED  → cancelled
 *   FAILED            → failed
 *   (unknown)         → pending
 */

const BASE = "https://api.xendit.co";

const CreateInvoiceResponseSchema = z.object({
  id: z.string().min(1),
  invoice_url: z.string().url(),
  external_id: z.string().min(1),
  status: z.string().min(1),
});

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

function resolveAmount(tier: string): number {
  if (!isPaidTier(tier)) {
    throw new Error(`xendit: cannot create checkout for non-paid tier "${tier}"`);
  }
  return TIER_PRICE_IDR[tier];
}

function narrowTier(t: string | undefined): Tier | undefined {
  if (!t) return undefined;
  return (TIERS as readonly string[]).includes(t) ? (t as Tier) : undefined;
}

function basicAuthHeader(secret: string): string {
  // Node 20 has global Buffer; Basic auth is base64("secret:")
  const token = Buffer.from(`${secret}:`).toString("base64");
  return `Basic ${token}`;
}

function statusToEventKind(status: PaymentStatus): PaymentEventKind {
  switch (status) {
    case "paid":
      return "checkout_completed";
    case "failed":
      return "payment_failed";
    case "cancelled":
      return "subscription_cancelled";
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

export class XenditAdapter implements PaymentAdapter {
  readonly code = "xendit";

  async createCheckoutSession(
    input: CreateCheckoutSessionInput
  ): Promise<CreateCheckoutSessionResult> {
    const secret = config.XENDIT_SECRET_KEY;
    if (!secret) {
      throw new Error(
        "xendit: XENDIT_SECRET_KEY is not set; cannot create checkout session"
      );
    }

    const amount = resolveAmount(input.tier);
    // `external_id` must be unique per invoice on Xendit's side. Namespacing
    // by profile + tier + timestamp keeps retries distinguishable.
    const externalId = `addv_${input.profileId}_${input.tier}_${Date.now()}`;

    const body = {
      external_id: externalId,
      amount,
      payer_email: input.customerEmail,
      success_redirect_url: input.successUrl,
      failure_redirect_url: input.cancelUrl,
      description: `Addvantage ${input.tier} tier`,
      items: [
        {
          name: input.tier,
          quantity: 1,
          price: amount,
        },
      ],
      metadata: {
        profile_id: input.profileId,
        tier: input.tier,
      },
    };

    const raw = await retry(
      async () => {
        const res = await fetch(`${BASE}/v2/invoices`, {
          method: "POST",
          headers: {
            Authorization: basicAuthHeader(secret),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(
            `xendit: HTTP ${res.status} ${res.statusText} ${text}`
          );
        }
        return (await res.json()) as unknown;
      },
      {
        label: "xendit.create_invoice",
        attempts: 3,
      }
    );

    const parsed = CreateInvoiceResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `xendit: unexpected create-invoice response: ${parsed.error.message}`
      );
    }

    return {
      checkoutUrl: parsed.data.invoice_url,
      externalRef: parsed.data.id,
    };
  }

  async verifyWebhook(
    input: VerifyWebhookInput
  ): Promise<VerifyWebhookResult> {
    const expected = config.XENDIT_WEBHOOK_TOKEN;
    if (!expected) {
      return { valid: false };
    }

    const received = input.headers["x-callback-token"];
    if (!received || received !== expected) {
      return { valid: false };
    }

    let json: unknown;
    try {
      json = JSON.parse(input.rawBody);
    } catch (err) {
      logger.warn(
        { err: String(err), scope: "xendit.verify", reason: "bad_json" },
        "xendit webhook: bad JSON body"
      );
      return { valid: false };
    }

    const parsed = InvoiceCallbackSchema.safeParse(json);
    if (!parsed.success) {
      return { valid: false };
    }

    const cb = parsed.data;
    const status = this.mapStatus(cb.status);
    const event: PaymentEvent = {
      kind: statusToEventKind(status),
      externalRef: cb.id,
      profileId: cb.metadata?.profile_id,
      tier: narrowTier(cb.metadata?.tier),
      occurredAt: occurredAtOf(cb),
      raw: cb,
    };

    return { valid: true, event };
  }

  mapStatus(externalStatus: string): PaymentStatus {
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
}

export const xenditAdapter = new XenditAdapter();
