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

export type { EmailProvider, SendTemplateOpts, SendResult } from "./types.js";
