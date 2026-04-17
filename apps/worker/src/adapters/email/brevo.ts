import { z } from "zod";
import { config } from "../../lib/config";
import { retry } from "../../lib/retry";
import type {
  EmailAdapter,
  SendRawInput,
  SendResult,
  SendTemplateInput,
} from "./base";

/**
 * Brevo (formerly Sendinblue) transactional email adapter.
 *
 * Docs: https://developers.brevo.com/reference/sendtransacemail
 *
 * Auth: `api-key` header containing the raw API key (NOT Basic auth).
 *
 * Endpoint: `POST https://api.brevo.com/v3/smtp/email`
 *
 * Body shape (template mode):
 *   {
 *     sender:    { email, name? },
 *     to:        [{ email, name? }],
 *     templateId: <number>,      // numeric ID from Brevo's template UI
 *     params?:   { ... },        // merge vars
 *     subject?:  <string>        // overrides template subject
 *   }
 *
 * Body shape (raw mode): same as above but with `htmlContent` / `textContent`
 * in place of `templateId`.
 *
 * Response shape for a single-recipient send is `{ messageId: string }`.
 * NOTE: Brevo returns `messageIds: string[]` instead when multiple `to`
 * addresses are supplied. We always send to exactly one recipient here, so
 * the singular form is the contract. If the adapter is ever extended to
 * batch-send, the response schema must be widened.
 */

const BASE = "https://api.brevo.com/v3";

const SendEmailResponseSchema = z.object({
  messageId: z.string().min(1),
});

function authHeaders(apiKey: string): Record<string, string> {
  return {
    "api-key": apiKey,
    "Content-Type": "application/json",
    accept: "application/json",
  };
}

async function postEmail(
  apiKey: string,
  body: Record<string, unknown>,
  label: string
): Promise<SendResult> {
  const raw = await retry(
    async () => {
      const res = await fetch(`${BASE}/smtp/email`, {
        method: "POST",
        headers: authHeaders(apiKey),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `brevo: HTTP ${res.status} ${res.statusText} ${text}`
        );
      }
      return (await res.json()) as unknown;
    },
    {
      label,
      attempts: 3,
    }
  );

  const parsed = SendEmailResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `brevo: unexpected send-email response: ${parsed.error.message}`
    );
  }

  return {
    messageId: parsed.data.messageId,
    provider: "brevo",
  };
}

export class BrevoAdapter implements EmailAdapter {
  readonly code = "brevo";

  private requireKey(): string {
    const key = config.BREVO_API_KEY;
    if (!key) {
      throw new Error(
        "brevo: BREVO_API_KEY is not set; cannot send email"
      );
    }
    return key;
  }

  private sender(): { email: string; name: string } {
    // TODO: Override EMAIL_SENDER_EMAIL / EMAIL_SENDER_NAME in production env.
    // Both fall back to placeholder defaults so dev boots cleanly — but Brevo
    // will reject sends from any sender that is not verified in the dashboard.
    return {
      email: config.EMAIL_SENDER_EMAIL,
      name: config.EMAIL_SENDER_NAME,
    };
  }

  async sendTemplate(input: SendTemplateInput): Promise<SendResult> {
    const apiKey = this.requireKey();

    // Brevo requires templateId to be numeric. Accept either `number` or a
    // numeric string and coerce — reject anything else.
    const templateIdNum =
      typeof input.templateId === "number"
        ? input.templateId
        : Number(input.templateId);
    if (!Number.isFinite(templateIdNum) || !Number.isInteger(templateIdNum)) {
      throw new Error(
        `brevo: templateId must be a numeric integer, got "${String(input.templateId)}"`
      );
    }

    const body: Record<string, unknown> = {
      sender: this.sender(),
      to: [
        input.to.name
          ? { email: input.to.email, name: input.to.name }
          : { email: input.to.email },
      ],
      templateId: templateIdNum,
    };
    if (input.params) body.params = input.params;
    if (input.subject) body.subject = input.subject;

    return postEmail(apiKey, body, "brevo.send_template");
  }

  async sendRaw(input: SendRawInput): Promise<SendResult> {
    const apiKey = this.requireKey();

    if (!input.html && !input.text) {
      throw new Error("brevo: sendRaw requires at least one of html/text");
    }

    const body: Record<string, unknown> = {
      sender: this.sender(),
      to: [
        input.to.name
          ? { email: input.to.email, name: input.to.name }
          : { email: input.to.email },
      ],
      subject: input.subject,
    };
    if (input.html) body.htmlContent = input.html;
    if (input.text) body.textContent = input.text;
    if (input.replyTo) {
      body.replyTo = input.replyTo.name
        ? { email: input.replyTo.email, name: input.replyTo.name }
        : { email: input.replyTo.email };
    }

    return postEmail(apiKey, body, "brevo.send_raw");
  }
}

export const brevoAdapter = new BrevoAdapter();
