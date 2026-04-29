import { emailLayout } from "./layout.js";

export interface VerifyEmailParams {
  verifyUrl: string;
}

export function verifyEmailTemplate(params: VerifyEmailParams): { subject: string; html: string } {
  const body = `
    <p>Welcome to TradeVantage. Please verify your email address to activate your account.</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${params.verifyUrl}" class="btn">Verify Email</a>
    </p>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break:break-all;font-size:13px;color:#6366f1;">${params.verifyUrl}</p>
    <p>This link expires in 24 hours.</p>`;

  return {
    subject: "Verify your TradeVantage email",
    html: emailLayout("Verify your email", body),
  };
}
