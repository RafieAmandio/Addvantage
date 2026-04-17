import type { EmailAdapter } from "./base";

export const EMAIL_ADAPTERS: Record<string, EmailAdapter> = {};

export function getEmailAdapter(code: string): EmailAdapter {
  const adapter = EMAIL_ADAPTERS[code];
  if (!adapter) {
    const known = Object.keys(EMAIL_ADAPTERS).join(", ") || "(none registered)";
    throw new Error(`Unknown email adapter "${code}". Known: ${known}`);
  }
  return adapter;
}

export type { EmailAdapter, SendTemplateInput, SendRawInput, SendResult } from "./base";
