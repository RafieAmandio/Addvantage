import { z } from "zod";
import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";
import type { EmailProvider, SendTemplateOpts, SendHtmlOpts, SendResult } from "../../types.js";

const BASE = "https://api.resend.com";

const SendEmailResponseSchema = z.object({
  id: z.string().min(1),
});

export class ResendProvider implements EmailProvider {
  name = "resend" as const;

  private getConfig() {
    const apiKey = env.RESEND_API_KEY;
    const senderEmail = env.EMAIL_SENDER_EMAIL;
    const senderName = env.EMAIL_SENDER_NAME;

    if (!apiKey || !senderEmail) {
      logger.warn({ scope: "email.resend" }, "resend send skipped: env unset");
      return null;
    }

    const from = senderName ? `${senderName} <${senderEmail}>` : senderEmail;
    return { apiKey, from };
  }

  private async send(body: Record<string, unknown>, apiKey: string): Promise<SendResult> {
    const res = await fetch(`${BASE}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`resend: HTTP ${res.status} ${res.statusText} ${text}`);
    }

    const raw = (await res.json()) as unknown;
    const parsed = SendEmailResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`resend: unexpected response: ${parsed.error.message}`);
    }

    return { provider: "resend", messageId: parsed.data.id };
  }

  async sendTemplate(opts: SendTemplateOpts): Promise<SendResult | null> {
    const cfg = this.getConfig();
    if (!cfg) return null;

    const body: Record<string, unknown> = {
      from: cfg.from,
      to: [opts.to.email],
      subject: opts.subject ?? "TradeVantage",
      html: `<p>Template ${opts.templateId}</p>`,
    };

    return this.send(body, cfg.apiKey);
  }

  async sendHtml(opts: SendHtmlOpts): Promise<SendResult | null> {
    const cfg = this.getConfig();
    if (!cfg) return null;

    const body: Record<string, unknown> = {
      from: cfg.from,
      to: [opts.to.email],
      subject: opts.subject,
      html: opts.html,
    };
    if (opts.replyTo) body.reply_to = opts.replyTo;

    return this.send(body, cfg.apiKey);
  }
}
