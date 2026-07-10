import { env } from "@/config/env.js";
import type { EmailProvider } from "./types.js";
import { BrevoProvider } from "./providers/brevo/provider.js";
import { ResendProvider } from "./providers/resend/provider.js";

export function getEmailProvider(): EmailProvider | null {
  const name = env.EMAIL_PROVIDER;
  if (!name) return null;
  switch (name) {
    case "brevo":
      return new BrevoProvider();
    case "resend":
      return new ResendProvider();
    default:
      return null;
  }
}

export type { EmailProvider, SendTemplateOpts, SendHtmlOpts, SendResult } from "./types.js";
export { dunningEmail, renewalReminderEmail, invoiceCreatedEmail, verifyEmailTemplate, earlyAccessConfirmationEmail, earlyAccessInvoiceEmail } from "./templates/index.js";
export type { DunningParams, RenewalReminderParams, InvoiceCreatedParams, VerifyEmailParams, EarlyAccessConfirmationParams, EarlyAccessInvoiceParams } from "./templates/index.js";
