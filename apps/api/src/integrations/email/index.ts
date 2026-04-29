import { env } from "@/config/env.js";
import type { EmailProvider } from "./types.js";
import { BrevoProvider } from "./providers/brevo/provider.js";

export function getEmailProvider(): EmailProvider | null {
  const name = env.EMAIL_PROVIDER;
  if (!name) return null;
  switch (name) {
    case "brevo":
      return new BrevoProvider();
    default:
      return null;
  }
}

export type { EmailProvider, SendTemplateOpts, SendHtmlOpts, SendResult } from "./types.js";
export { dunningEmail, renewalReminderEmail, invoiceCreatedEmail, verifyEmailTemplate } from "./templates/index.js";
export type { DunningParams, RenewalReminderParams, InvoiceCreatedParams, VerifyEmailParams } from "./templates/index.js";
