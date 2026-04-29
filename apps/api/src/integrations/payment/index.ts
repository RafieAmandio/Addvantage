import { env } from "@/config/env.js";
import type { PaymentProvider } from "./types.js";
import { XenditProvider } from "./providers/xendit/provider.js";

export function getPaymentProvider(): PaymentProvider | null {
  const name = env.PAYMENT_PROVIDER;
  if (!name) return null;
  switch (name) {
    case "xendit":
      return new XenditProvider();
    default:
      return null;
  }
}

export type {
  PaymentProvider,
  PaymentEvent,
  PaymentEventKind,
  VerifyResult,
  CreateInvoiceOpts,
  InvoiceResult,
} from "./types.js";
