import { config } from "../../lib/config";
import type { EmailAdapter } from "./base";
import { brevoAdapter } from "./brevo";

/**
 * Registry of all available email providers, keyed by adapter `code`.
 * Adapters self-register here only when their required env vars are set,
 * so misconfigured providers surface via `getEmailAdapter()`'s
 * "unknown adapter" error rather than failing mid-request.
 */
export const EMAIL_ADAPTERS: Record<string, EmailAdapter> = {};

if (config.BREVO_API_KEY) {
  EMAIL_ADAPTERS[brevoAdapter.code] = brevoAdapter;
}

export function getEmailAdapter(code: string): EmailAdapter {
  const adapter = EMAIL_ADAPTERS[code];
  if (!adapter) {
    const known = Object.keys(EMAIL_ADAPTERS).join(", ") || "(none registered)";
    throw new Error(`Unknown email adapter "${code}". Known: ${known}`);
  }
  return adapter;
}

export type { EmailAdapter, SendTemplateInput, SendRawInput, SendResult } from "./base";
