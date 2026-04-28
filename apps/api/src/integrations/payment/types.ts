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

export interface PaymentProvider {
  name: string;
  verifyWebhook(req: Request): VerifyResult;
}
