import { z } from "zod";
import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";
import type { EmailProvider, SendTemplateOpts, SendHtmlOpts, SendResult } from "../../types.js";

const BASE = "https://api.brevo.com/v3";

const SendEmailResponseSchema = z.object({
  messageId: z.string().min(1),
});

export class BrevoProvider implements EmailProvider {
  name = "brevo" as const;

  private getSenderAndKey() {
    const apiKey = env.BREVO_API_KEY;
    const senderEmail = env.EMAIL_SENDER_EMAIL;
    const senderName = env.EMAIL_SENDER_NAME;

    if (!apiKey || !senderEmail || !senderName) {
      logger.warn({ scope: "email.brevo" }, "brevo send skipped: env unset");
      return null;
    }

    return { apiKey, sender: { email: senderEmail, name: senderName } };
  }

  private async send(body: Record<string, unknown>, apiKey: string): Promise<SendResult> {
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

  async sendTemplate(opts: SendTemplateOpts): Promise<SendResult | null> {
    const cfg = this.getSenderAndKey();
    if (!cfg) return null;

    const body: Record<string, unknown> = {
      sender: cfg.sender,
      to: [opts.to.name ? { email: opts.to.email, name: opts.to.name } : { email: opts.to.email }],
      templateId: opts.templateId,
    };
    if (opts.params) body.params = opts.params;
    if (opts.subject) body.subject = opts.subject;

    return this.send(body, cfg.apiKey);
  }

  async sendHtml(opts: SendHtmlOpts): Promise<SendResult | null> {
    const cfg = this.getSenderAndKey();
    if (!cfg) return null;

    const body: Record<string, unknown> = {
      sender: cfg.sender,
      to: [opts.to.name ? { email: opts.to.email, name: opts.to.name } : { email: opts.to.email }],
      subject: opts.subject,
      htmlContent: opts.html,
    };
    if (opts.replyTo) body.replyTo = { email: opts.replyTo };

    return this.send(body, cfg.apiKey);
  }
}
