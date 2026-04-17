import { config } from "../../lib/config";
import type { PaymentAdapter } from "./base";
import { xenditAdapter } from "./xendit";

/**
 * Registry of all available payment providers, keyed by adapter `code`.
 * Adapters self-register here only when their required env vars are set,
 * so misconfigured providers surface via `getPaymentAdapter()`'s
 * "unknown adapter" error rather than failing mid-request.
 */
export const PAYMENT_ADAPTERS: Record<string, PaymentAdapter> = {};

if (config.XENDIT_SECRET_KEY && config.XENDIT_WEBHOOK_TOKEN) {
  PAYMENT_ADAPTERS[xenditAdapter.code] = xenditAdapter;
}

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
