import type { Request } from "express";

export type PaymentEventKind =
  | "checkout_completed"
  | "subscription_renewed"
  | "subscription_cancelled"
  | "payment_failed";

export interface PaymentEvent {
  kind: PaymentEventKind;
  externalRef: string;
  profileId?: string;
  tier?: string;
  occurredAt: Date;
  raw: unknown;
}

export type VerifyResult =
  | { valid: true; event: PaymentEvent }
  | { valid: false; reason: string };

export interface CreateInvoiceOpts {
  externalRef: string;
  amount: number;
  currency: string;
  description: string;
  payerEmail: string;
  metadata?: Record<string, string>;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
}

export interface InvoiceResult {
  externalId: string;
  invoiceUrl: string;
  status: string;
  expiresAt?: Date;
}

export interface PaymentProvider {
  name: string;
  verifyWebhook(req: Request): VerifyResult;
  createInvoice(opts: CreateInvoiceOpts): Promise<InvoiceResult>;
}
