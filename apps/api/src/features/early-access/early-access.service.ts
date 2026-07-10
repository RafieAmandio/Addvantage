import { logger } from "@/config/logger.js";
import {
  getEmailProvider,
  earlyAccessConfirmationEmail,
  earlyAccessInvoiceEmail,
} from "@/integrations/email/index.js";
import {
  EARLY_ACCESS_PRICE,
  type PaymentMethod,
  type EarlyAccessLeadInput,
  type EarlyAccessApplicationInput,
} from "@tradevantage/shared/schema";
import { earlyAccessRepository } from "./early-access.repository.js";

// Founding early-access offer surfaced in the welcome email.
const CONFIRMATION = {
  bonusMonths: 2,
  subscriptionStart: "Monday, 13 July 2026",
  freeThrough: "30 September 2026",
  subscriptionThrough: "30 September 2027",
  accessEmailDate: "Monday, 13 July 2026",
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  usdt: "USDT (TRC20 / Tron)",
  bca: "Bank transfer (BCA)",
};

const AMOUNT_LABELS: Record<PaymentMethod, string> = {
  usdt: "$850 USDT",
  bca: "IDR 18,000,000",
};

export const earlyAccessService = {
  // Persist the lead from the identity step and hand back enough of the row to
  // restore a returning visitor's draft (or tell them they already applied).
  async startLead(input: EarlyAccessLeadInput) {
    const row = await earlyAccessRepository.upsertLead(input);
    return {
      status: row.status,
      application: {
        wantsCashback: row.wantsCashback,
        broker: row.broker,
        brokerAccountRef: row.brokerAccountRef,
        signedName: row.signedName,
        acknowledgements: row.acknowledgements,
        paymentMethod: row.paymentMethod,
        proofImageUrl: row.proofImageUrl,
      },
    };
  },

  async submit(input: EarlyAccessApplicationInput) {
    // Amount is server-authoritative — never trust the client for pricing.
    const price = EARLY_ACCESS_PRICE[input.paymentMethod];

    const application = await earlyAccessRepository.finalize({
      email: input.email,
      telegramHandle: input.telegramHandle,
      wantsCashback: input.wantsCashback,
      broker: input.broker ?? null,
      brokerAccountRef: input.brokerAccountRef ?? null,
      signedName: input.signedName,
      signedAt: new Date(),
      acknowledgements: input.acknowledgements,
      paymentMethod: input.paymentMethod,
      paymentAmount: price.amount,
      paymentCurrency: price.currency,
      proofImageUrl: input.proofImageUrl,
    });

    // Only email on the first finalize (idempotent on resubmit).
    if (!application.confirmationEmailSentAt) {
      await sendOnboardingEmails(application.id, input.email, input.paymentMethod);
    }

    return { id: application.id };
  },
};

// Sends two emails on payment: the invoice/receipt, then the welcome email.
// Best-effort — a mail failure must never fail the application submit.
async function sendOnboardingEmails(
  id: string,
  email: string,
  method: PaymentMethod,
): Promise<void> {
  const provider = getEmailProvider();
  if (!provider) {
    logger.warn({ id }, "early-access: no email provider; skipping onboarding emails");
    return;
  }

  const to = { email };

  try {
    const invoice = earlyAccessInvoiceEmail({
      reference: id.slice(0, 8).toUpperCase(),
      date: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      methodLabel: METHOD_LABELS[method],
      amountLabel: AMOUNT_LABELS[method],
    });
    await provider.sendHtml({ to, subject: invoice.subject, html: invoice.html });
  } catch (err) {
    logger.error({ err: String(err), id }, "early-access: invoice email failed");
  }

  try {
    const welcome = earlyAccessConfirmationEmail(CONFIRMATION);
    await provider.sendHtml({ to, subject: welcome.subject, html: welcome.html });
  } catch (err) {
    logger.error({ err: String(err), id }, "early-access: welcome email failed");
  }

  await earlyAccessRepository.markConfirmationSent(id);
  logger.info({ id }, "early-access: onboarding emails sent (invoice + welcome)");
}
