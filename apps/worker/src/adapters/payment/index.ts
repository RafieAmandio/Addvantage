import type { PaymentAdapter } from "./base";

/**
 * Registry of all available payment providers, keyed by adapter `code`.
 * Empty until a concrete adapter (e.g. Xendit) is registered.
 */
export const PAYMENT_ADAPTERS: Record<string, PaymentAdapter> = {};

/** Look up an adapter by code, throwing a clear error when unknown. */
export function getPaymentAdapter(code: string): PaymentAdapter {
  const adapter = PAYMENT_ADAPTERS[code];
  if (!adapter) {
    const known = Object.keys(PAYMENT_ADAPTERS).join(", ") || "(none)";
    throw new Error(
      `Unknown payment adapter "${code}". Known adapters: ${known}`
    );
  }
  return adapter;
}

export type {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
  PaymentAdapter,
  PaymentEvent,
  PaymentEventKind,
  PaymentStatus,
  VerifyWebhookInput,
  VerifyWebhookResult,
} from "./base";
