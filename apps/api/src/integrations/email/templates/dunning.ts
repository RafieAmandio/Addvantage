import { emailLayout } from "./layout.js";

export interface DunningParams {
  tier: string;
  externalRef: string;
  occurredAt: string;
}

export function dunningEmail(params: DunningParams): { subject: string; html: string } {
  const body = `
    <p>We were unable to process your payment for the <strong>${params.tier}</strong> plan.</p>
    <div class="meta">
      <strong>Reference:</strong> ${params.externalRef}<br />
      <strong>Date:</strong> ${new Date(params.occurredAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
    </div>
    <p>Please update your payment method to avoid any interruption to your subscription. If you believe this is an error, contact us and we'll sort it out.</p>
  `;

  return {
    subject: "Action required: payment failed",
    html: emailLayout("Payment Failed", body),
  };
}
