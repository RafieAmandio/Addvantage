import type { Request } from "express";
import type { Prisma } from "@tradevantage/db";
import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";
import { UnauthorizedError, AppError } from "@/core/errors/index.js";
import { getPaymentProvider, type PaymentEvent } from "@/integrations/payment/index.js";
import { getEmailProvider } from "@/integrations/email/index.js";
import { subscriptionRepository } from "./subscription.repository.js";

export const subscriptionService = {
  async getStatus(profileId: string) {
    const status = await subscriptionRepository.getSubscriptionStatus(profileId);
    if (!status) throw new AppError("Profile not found", 404);
    return status;
  },

  async getHistory(profileId: string, limit: number) {
    return subscriptionRepository.getPaymentHistory(profileId, limit);
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

  const templateId = env.DUNNING_TEMPLATE_ID;
  if (!templateId) {
    logger.warn({
      scope: "subscription.webhook",
      externalRef: event.externalRef,
    }, "payment_failed: DUNNING_TEMPLATE_ID unset");
    return { received: true, sent: false, reason: "template_unset" };
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
    const sendResult = await emailProvider.sendTemplate({
      to: { email: profile.email, name: profile.handle ?? undefined },
      templateId,
      params: {
        tier: profile.tier,
        externalRef: event.externalRef,
        occurredAt: event.occurredAt.toISOString(),
      },
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
        templateId: String(templateId),
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
