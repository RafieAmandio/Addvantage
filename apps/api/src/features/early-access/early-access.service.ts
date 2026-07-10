import { logger } from "@/config/logger.js";
import {
  getEmailProvider,
  earlyAccessConfirmationEmail,
} from "@/integrations/email/index.js";
import {
  EARLY_ACCESS_PRICE,
  type EarlyAccessApplicationInput,
} from "@tradevantage/shared/schema";
import { earlyAccessRepository } from "./early-access.repository.js";

// Founding early-access offer surfaced in the confirmation email.
const CONFIRMATION = {
  bonusMonths: 2,
  subscriptionStart: "30 September 2026",
  accessEmailDate: "Monday, 13 July 2026",
};

export const earlyAccessService = {
  async submit(input: EarlyAccessApplicationInput) {
    // Amount is server-authoritative — never trust the client for pricing.
    const price = EARLY_ACCESS_PRICE[input.paymentMethod];

    const application = await earlyAccessRepository.create({
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

    await sendConfirmationEmail(application.id, input.email);

    return { id: application.id };
  },
};

// Best-effort: a mail failure must never fail the application submit.
async function sendConfirmationEmail(id: string, email: string): Promise<void> {
  const provider = getEmailProvider();
  if (!provider) {
    logger.warn({ id }, "early-access: no email provider; skipping confirmation");
    return;
  }

  const { subject, html } = earlyAccessConfirmationEmail(CONFIRMATION);
  try {
    await provider.sendHtml({ to: { email }, subject, html });
    await earlyAccessRepository.markConfirmationSent(id);
    logger.info({ id }, "early-access: confirmation email sent");
  } catch (err) {
    logger.error({ err: String(err), id }, "early-access: confirmation email failed");
  }
}
