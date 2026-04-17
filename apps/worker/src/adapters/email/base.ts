// Provider-agnostic email adapter. First concrete implementation is BrevoAdapter (E2).
// Mirrors PaymentAdapter and BarsAdapter shape — pure TS, no provider SDKs at this layer.

export interface SendTemplateInput {
  to: { email: string; name?: string };
  templateId: number | string;
  params?: Record<string, unknown>;
  subject?: string;
}

export interface SendRawInput {
  to: { email: string; name?: string };
  subject: string;
  html?: string;
  text?: string;
  replyTo?: { email: string; name?: string };
}

export interface SendResult {
  messageId: string;
  provider: string;
}

export interface EmailAdapter {
  code: string;
  sendTemplate(input: SendTemplateInput): Promise<SendResult>;
  sendRaw(input: SendRawInput): Promise<SendResult>;
}
