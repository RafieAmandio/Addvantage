import { emailLayout } from "./layout.js";

export interface InvoiceCreatedParams {
  tier: string;
  amount: number;
  currency: string;
  invoiceUrl: string;
}

export function invoiceCreatedEmail(params: InvoiceCreatedParams): { subject: string; html: string } {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: params.currency,
  }).format(params.amount);

  const body = `
    <p>Your invoice for the <strong>${params.tier}</strong> plan is ready.</p>
    <div class="meta">
      <strong>Amount:</strong> ${formatted}<br />
      <strong>Plan:</strong> ${params.tier}
    </div>
    <p style="text-align: center; margin-top: 24px;">
      <a href="${params.invoiceUrl}" class="btn">Pay Now</a>
    </p>
    <p style="font-size: 13px; color: #71717a;">If the button doesn't work, copy this link: ${params.invoiceUrl}</p>
  `;

  return {
    subject: `Invoice for your ${params.tier} plan — ${formatted}`,
    html: emailLayout("Invoice", body),
  };
}
