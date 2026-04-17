/**
 * Provider-agnostic payment adapter.
 *
 * Consumed by both the worker (webhook verification + event processing) and
 * the web app (creating checkout sessions from Server Actions / Route
 * Handlers). Kept framework-neutral — pure TS, no Next.js or grammY imports.
 *
 * Tier is passed as an opaque string. The source of truth for the enum of
 * valid tiers lives in the DB (`profiles.tier`), with parallel constants in
 * `packages/shared/src/constants/` when those land. Concrete adapters MAY
 * tighten the type, but the interface stays loose so providers can be
 * registered without a circular dep on shared taxonomy.
 */

/** Normalized payment status across providers. */
export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled";

/** Normalized event kind the worker cares about when reacting to a webhook. */
export type PaymentEventKind =
  | "checkout_completed"
  | "subscription_renewed"
  | "subscription_cancelled"
  | "payment_failed";

/**
 * Provider-neutral event emitted by `verifyWebhook`. `raw` preserves the
 * original provider payload for auditing and debugging; downstream handlers
 * should rely on the normalized fields.
 */
export interface PaymentEvent {
  kind: PaymentEventKind;
  /** Provider-side identifier (checkout session id, invoice id, etc.). */
  externalRef: string;
  /** Addvantage profile id — present when the provider echoed our metadata. */
  profileId?: string;
  /** Tier string echoed from checkout metadata; opaque at this layer. */
  tier?: string;
  /** When the event occurred according to the provider. */
  occurredAt: Date;
  /** Original provider payload, untouched. */
  raw: unknown;
}

export interface CreateCheckoutSessionInput {
  /** Target tier the user is purchasing/renewing. Opaque string (see module doc). */
  tier: string;
  /** Addvantage `profiles.id` initiating the checkout. */
  profileId: string;
  /** Absolute URL the provider should redirect to on success. */
  successUrl: string;
  /** Absolute URL the provider should redirect to on cancel. */
  cancelUrl: string;
  /** Optional; pre-fills the provider's checkout form when supported. */
  customerEmail?: string;
}

export interface CreateCheckoutSessionResult {
  /** URL to redirect the end-user to. */
  checkoutUrl: string;
  /** Provider-side reference (e.g. session/invoice id) stored for reconciliation. */
  externalRef: string;
}

export interface VerifyWebhookInput {
  /** Raw request body exactly as received — required for signature verification. */
  rawBody: string;
  /** Request headers, lowercased keys recommended. */
  headers: Record<string, string>;
}

export interface VerifyWebhookResult {
  /** `true` iff signature + payload shape validated. */
  valid: boolean;
  /** Populated iff `valid` and the event maps to a known `PaymentEventKind`. */
  event?: PaymentEvent;
}

export interface PaymentAdapter {
  /** Stable identifier for the provider, e.g. "xendit". */
  readonly code: string;

  /** Create a hosted checkout session and return the redirect URL. */
  createCheckoutSession(
    input: CreateCheckoutSessionInput
  ): Promise<CreateCheckoutSessionResult>;

  /** Verify a webhook signature and, if valid, normalize to a `PaymentEvent`. */
  verifyWebhook(input: VerifyWebhookInput): Promise<VerifyWebhookResult>;

  /** Translate a provider-native status string to the normalized enum. */
  mapStatus(externalStatus: string): PaymentStatus;
}
