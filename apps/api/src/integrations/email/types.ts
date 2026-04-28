export interface SendTemplateOpts {
  to: { email: string; name?: string };
  templateId: number;
  params?: Record<string, unknown>;
  subject?: string;
}

export interface SendResult {
  provider: string;
  messageId: string;
}

export interface EmailProvider {
  name: string;
  sendTemplate(opts: SendTemplateOpts): Promise<SendResult | null>;
}
