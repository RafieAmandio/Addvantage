import { z } from "zod";
import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";
import type { EmailProvider, SendTemplateOpts, SendResult } from "../../types.js";

const BASE = "https://api.brevo.com/v3";

const SendEmailResponseSchema = z.object({
  messageId: z.string().min(1),
});

export class BrevoProvider implements EmailProvider {
  name = "brevo" as const;

  async sendTemplate(opts: SendTemplateOpts): Promise<SendResult | null> {
    const apiKey = env.BREVO_API_KEY;
    const senderEmail = env.EMAIL_SENDER_EMAIL;
    const senderName = env.EMAIL_SENDER_NAME;

    if (!apiKey || !senderEmail || !senderName) {
      logger.warn({ scope: "email.brevo" }, "brevo send skipped: env unset");
      return null;
    }

    const body: Record<string, unknown> = {
      sender: { email: senderEmail, name: senderName },
      to: [
        opts.to.name
          ? { email: opts.to.email, name: opts.to.name }
          : { email: opts.to.email },
      ],
      templateId: opts.templateId,
    };
    if (opts.params) body.params = opts.params;
    if (opts.subject) body.subject = opts.subject;

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
      throw new Error(`brevo: HTTP ${res.status} ${res.statusText} ${text}`);
    }

    const raw = (await res.json()) as unknown;
    const parsed = SendEmailResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`brevo: unexpected response: ${parsed.error.message}`);
    }

    return { provider: "brevo", messageId: parsed.data.messageId };
  }
}
