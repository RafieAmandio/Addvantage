import { z } from "zod";
import { serverConfig } from "@/lib/config/server";
import { logger } from "@/lib/logger";

/**
 * Brevo transactional email helper (web-side copy).
 *
 * Parallels `apps/worker/src/adapters/email/brevo.ts` — deliberately duplicated
 * rather than shared via a package so web and worker can evolve their env
 * contracts independently. Same precedent as `lib/payment/verify-xendit.ts`.
 *
 * Pattern: graceful no-op. Returns `null` (and logs a warning) when any required
 * env is missing — mirrors the heartbeat / Twelve Data / Upstash approach so web
 * can boot without email wired. Callers handle the null path.
 *
 * Docs: https://developers.brevo.com/reference/sendtransacemail
 * Auth: `api-key` header (raw key, NOT Basic).
 * Response (single recipient): `{ messageId: string }`.
 */

if (typeof window !== "undefined") {
  throw new Error("[web] lib/email/brevo.ts imported from client bundle");
}

const BASE = "https://api.brevo.com/v3";

const SendEmailResponseSchema = z.object({
  messageId: z.string().min(1),
});

export interface SendBrevoTemplateInput {
  to: { email: string; name?: string };
  templateId: number;
  params?: Record<string, unknown>;
  subject?: string;
}

export interface SendBrevoTemplateResult {
  provider: "brevo";
  messageId: string;
}

export async function sendBrevoTemplate(
  input: SendBrevoTemplateInput
): Promise<SendBrevoTemplateResult | null> {
  const apiKey = serverConfig.BREVO_API_KEY;
  const senderEmail = serverConfig.EMAIL_SENDER_EMAIL;
  const senderName = serverConfig.EMAIL_SENDER_NAME;

  if (!apiKey || !senderEmail || !senderName) {
    logger.warn("brevo send skipped: env unset", {
      scope: "lib.email.brevo",
      hasApiKey: Boolean(apiKey),
      hasSenderEmail: Boolean(senderEmail),
      hasSenderName: Boolean(senderName),
    });
    return null;
  }

  const body: Record<string, unknown> = {
    sender: { email: senderEmail, name: senderName },
    to: [
      input.to.name
        ? { email: input.to.email, name: input.to.name }
        : { email: input.to.email },
    ],
    templateId: input.templateId,
  };
  if (input.params) body.params = input.params;
  if (input.subject) body.subject = input.subject;

  const res = await fetch(`${BASE}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `brevo: HTTP ${res.status} ${res.statusText} ${text}`
    );
  }

  const raw = (await res.json()) as unknown;
  const parsed = SendEmailResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `brevo: unexpected send-email response: ${parsed.error.message}`
    );
  }

  return { provider: "brevo", messageId: parsed.data.messageId };
}
