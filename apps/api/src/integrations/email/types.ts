export interface SendTemplateOpts {
  to: { email: string; name?: string };
  templateId: number;
  params?: Record<string, unknown>;
  subject?: string;
}

export interface SendHtmlOpts {
  to: { email: string; name?: string };
  subject: string;
  html: string;
  replyTo?: string;
}

export interface SendResult {
  provider: string;
  messageId: string;
}

export interface EmailProvider {
  name: string;
  sendTemplate(opts: SendTemplateOpts): Promise<SendResult | null>;
  sendHtml(opts: SendHtmlOpts): Promise<SendResult | null>;
}
