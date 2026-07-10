import { emailLayout } from "./layout.js";

export interface EarlyAccessConfirmationParams {
  bonusMonths: number;
  subscriptionStart: string;
  accessEmailDate: string;
}

export function earlyAccessConfirmationEmail(
  params: EarlyAccessConfirmationParams,
): { subject: string; html: string } {
  const body = `
    <p>Your early-access request is in. Welcome aboard, operator.</p>
    <p>You are locked in as a founding early-access member:</p>
    <div class="meta">
      <p><strong>${params.bonusMonths} bonus months</strong> added on top of your access.</p>
      <p>Your subscription starts <strong>${params.subscriptionStart}</strong>.</p>
    </div>
    <p>We are verifying your payment and broker details now. Your access instructions will reach you by <strong>${params.accessEmailDate}</strong>. Nothing else is needed from you until then.</p>`;

  return {
    subject: "You're in: TradeVantage early access",
    html: emailLayout("Early access confirmed", body),
  };
}
