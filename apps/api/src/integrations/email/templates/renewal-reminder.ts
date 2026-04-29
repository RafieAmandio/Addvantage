import { emailLayout } from "./layout.js";

export interface RenewalReminderParams {
  tier: string;
  renewsAt: string;
}

export function renewalReminderEmail(params: RenewalReminderParams): { subject: string; html: string } {
  const renewDate = new Date(params.renewsAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const body = `
    <p>Your <strong>${params.tier}</strong> subscription is renewing on <strong>${renewDate}</strong>.</p>
    <p>No action is needed if you'd like to continue. If you want to change or cancel your plan, please do so before the renewal date.</p>
  `;

  return {
    subject: `Your ${params.tier} plan renews on ${renewDate}`,
    html: emailLayout("Renewal Reminder", body),
  };
}
