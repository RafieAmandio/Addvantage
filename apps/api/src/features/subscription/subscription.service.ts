import type { Request } from "express";
import crypto from "node:crypto";
import type { Prisma } from "@tradevantage/db";
import { logger } from "@/config/logger.js";
import { UnauthorizedError, AppError } from "@/core/errors/index.js";
import { getPaymentProvider, type PaymentEvent } from "@/integrations/payment/index.js";
import { getEmailProvider, dunningEmail, invoiceCreatedEmail } from "@/integrations/email/index.js";
import { subscriptionRepository } from "./subscription.repository.js";
import type { CreateInvoiceInput } from "./subscription.validation.js";

export const subscriptionService = {
  async getStatus(profileId: string) {
    const status = await subscriptionRepository.getSubscriptionStatus(profileId);
    if (!status) throw new AppError("Profile not found", 404);
    return status;
  },

  async getHistory(profileId: string, limit: number) {
    return subscriptionRepository.getPaymentHistory(profileId, limit);
  },

  async createInvoice(profileId: string, input: CreateInvoiceInput) {
    const provider = getPaymentProvider();
    if (!provider) {
      throw new AppError("Payment provider not configured", 503);
    }

    const profile = await subscriptionRepository.findProfile(profileId);
    if (!profile) throw new AppError("Profile not found", 404);
    if (!profile.email) throw new AppError("Profile email is required to create an invoice", 400);

    const externalRef = `tv-${profileId.slice(0, 8)}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const description = input.description ?? `TradeVantage ${input.tier} subscription`;

    const invoice = await provider.createInvoice({
      externalRef,
      amount: input.amount,
      currency: input.currency,
      description,
      payerEmail: profile.email,
      metadata: { profile_id: profileId, tier: input.tier },
      successRedirectUrl: input.successRedirectUrl,
      failureRedirectUrl: input.failureRedirectUrl,
    });

    const payment = await subscriptionRepository.createPayment({
      profileId,
      externalId: invoice.externalId,
      externalRef,
      provider: provider.name,
      amount: input.amount,
      currency: input.currency,
      tier: input.tier,
      invoiceUrl: invoice.invoiceUrl,
      description,
      expiredAt: invoice.expiresAt,
      metadata: { profile_id: profileId, tier: input.tier } as Prisma.InputJsonValue,
    });

    const emailProvider = getEmailProvider();
    if (emailProvider) {
      try {
        const { subject, html } = invoiceCreatedEmail({
          tier: input.tier,
          amount: input.amount,
          currency: input.currency,
          invoiceUrl: invoice.invoiceUrl,
        });
        await emailProvider.sendHtml({
          to: { email: profile.email, name: profile.handle ?? undefined },
          subject,
          html,
        });
      } catch (err) {
        logger.warn({ err, scope: "subscription.createInvoice" }, "invoice email failed (non-fatal)");
      }
    }

    logger.info({
      scope: "subscription.createInvoice",
      profileId,
      externalRef,
      invoiceId: invoice.externalId,
    }, "invoice created");

    return {
      id: payment.id,
      externalRef,
      invoiceUrl: invoice.invoiceUrl,
      amount: input.amount,
      currency: input.currency,
      tier: input.tier,
      status: "pending",
    };
  },

  async downgrade(profileId: string) {
    const profile = await subscriptionRepository.findProfile(profileId);
    if (!profile) throw new AppError("Profile not found", 404);
    if (profile.tier === "free") throw new AppError("Already on free tier", 400);

    await subscriptionRepository.updateTier(profileId, "free");
    logger.info({ scope: "subscription.downgrade", profileId }, "tier downgraded to free");
    return { tier: "free" };
  },

  async handleWebhook(req: Request) {
    const provider = getPaymentProvider();
    if (!provider) {
      throw new AppError("Payment provider not configured", 503);
    }

    const result = provider.verifyWebhook(req);
    if (!result.valid) {
      throw new UnauthorizedError(result.reason);
    }

    const { event } = result;

    // Update the payment record if it exists
    try {
      const existing = await subscriptionRepository.findPaymentByExternalRef(event.externalRef);
      if (existing) {
        const statusMap: Record<string, string> = {
          checkout_completed: "paid",
          payment_failed: "failed",
          subscription_cancelled: "cancelled",
          subscription_renewed: "paid",
        };
        const newStatus = statusMap[event.kind] ?? existing.status;
        await subscriptionRepository.updatePaymentStatus(
          event.externalRef,
          newStatus,
          event.kind === "checkout_completed" ? event.occurredAt : undefined,
        );
      }
    } catch (err) {
      logger.warn({ err, scope: "subscription.webhook" }, "payment record update failed (non-fatal)");
    }

    if (event.kind === "payment_failed") {
      return handlePaymentFailed(event);
    }

    if (event.kind !== "checkout_completed") {
      logger.info({
        scope: "subscription.webhook",
        kind: event.kind,
        externalRef: event.externalRef,
      }, "non-terminal event, acknowledged");
      return { received: true, ignored: event.kind };
    }

    if (!event.profileId || !event.tier) {
      logger.warn({
        scope: "subscription.webhook",
        externalRef: event.externalRef,
      }, "missing profile metadata");
      throw new AppError("Missing profile metadata", 400);
    }

    await subscriptionRepository.updateTier(event.profileId, event.tier);

    logger.info({
      scope: "subscription.webhook",
      externalRef: event.externalRef,
      profileId: event.profileId,
      tier: event.tier,
    }, "tier updated");

    return { received: true };
  },
};

async function handlePaymentFailed(event: PaymentEvent) {
  if (!event.profileId) {
    logger.warn({
      scope: "subscription.webhook",
      externalRef: event.externalRef,
    }, "payment_failed: missing profile_id");
    return { received: true, sent: false, reason: "missing_profile_id" };
  }

  const profile = await subscriptionRepository.findProfile(event.profileId);
  if (!profile) {
    logger.warn({
      scope: "subscription.webhook",
      externalRef: event.externalRef,
      profileId: event.profileId,
    }, "payment_failed: profile not found");
    return { received: true, sent: false, reason: "profile_not_found" };
  }

  if (!profile.email) {
    logger.warn({
      scope: "subscription.webhook",
      externalRef: event.externalRef,
      profileId: event.profileId,
    }, "payment_failed: profile email missing");
    return { received: true, sent: false, reason: "email_missing" };
  }

  const emailProvider = getEmailProvider();
  if (!emailProvider) {
    return { received: true, sent: false, reason: "email_provider_unset" };
  }

  try {
    const { subject, html } = dunningEmail({
      tier: profile.tier,
      externalRef: event.externalRef,
      occurredAt: event.occurredAt.toISOString(),
    });

    const sendResult = await emailProvider.sendHtml({
      to: { email: profile.email, name: profile.handle ?? undefined },
      subject,
      html,
    });

    if (!sendResult) {
      return { received: true, sent: false, reason: "email_provider_unset" };
    }

    try {
      await subscriptionRepository.insertEmailLog({
        profileId: event.profileId,
        kind: "dunning",
        provider: sendResult.provider,
        externalMessageId: sendResult.messageId,
        templateId: null,
        payload: {
          externalRef: event.externalRef,
          raw: event.raw ?? null,
        } as Prisma.InputJsonValue,
      });
    } catch (err) {
      logger.error({
        err,
        scope: "subscription.webhook",
        externalRef: event.externalRef,
        profileId: event.profileId,
      }, "email_log insert failed (send succeeded)");
    }

    logger.info({
      scope: "subscription.webhook",
      externalRef: event.externalRef,
      profileId: event.profileId,
      messageId: sendResult.messageId,
    }, "dunning email sent");

    return { received: true, sent: true };
  } catch (err) {
    logger.error({
      err,
      scope: "subscription.webhook",
      externalRef: event.externalRef,
      profileId: event.profileId,
    }, "dunning send failed");
    return { received: true, sent: false, reason: "send_error" };
  }
}
