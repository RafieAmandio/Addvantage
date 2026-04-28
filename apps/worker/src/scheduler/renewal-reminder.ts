import * as Sentry from "@sentry/node";
import { prisma } from "@tradevantage/db";
import { config } from "../lib/config";
import { logger } from "../lib/logger";
import { retry } from "../lib/retry";
import { getEmailAdapter, EMAIL_ADAPTERS } from "../adapters/email";

/**
 * E3: Renewal reminder job.
 *
 * Runs daily. Finds profiles whose `renews_at` falls in a one-day window
 * (6 to 7 days out) and sends a Brevo transactional template. Every successful
 * send is recorded in `email_log` with kind='renewal_reminder' so re-runs
 * within a 7-day window don't double-send.
 */
export async function runRenewalReminders(): Promise<void> {
  const providerCode = config.EMAIL_PROVIDER ?? "brevo";

  if (Object.keys(EMAIL_ADAPTERS).length === 0) {
    logger.warn(
      { providerCode },
      "renewal-reminder: no email adapter registered; skipping run"
    );
    return;
  }

  if (!config.RENEWAL_TEMPLATE_ID) {
    logger.warn(
      "renewal-reminder: RENEWAL_TEMPLATE_ID unset; skipping run"
    );
    return;
  }

  logger.info("renewal-reminder: run start");

  const now = new Date();
  const windowStart = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const candidates = await prisma.profile.findMany({
    where: {
      renewsAt: { gte: windowStart, lt: windowEnd },
    },
    select: { id: true, email: true, handle: true, tier: true, renewsAt: true },
  });

  if (candidates.length === 0) {
    logger.info("renewal-reminder: no profiles in window");
    return;
  }

  const profileIds = candidates.map((p) => p.id);
  const recentSends = await prisma.emailLog.findMany({
    where: {
      kind: "renewal_reminder",
      sentAt: { gte: sevenDaysAgo },
      profileId: { in: profileIds },
    },
    select: { profileId: true },
  });

  const alreadySent = new Set(
    recentSends
      .map((r) => r.profileId)
      .filter((v): v is string => typeof v === "string")
  );

  const adapter = getEmailAdapter(providerCode);
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const p of candidates) {
    if (alreadySent.has(p.id)) {
      skipped++;
      continue;
    }
    if (!p.email) {
      skipped++;
      continue;
    }

    try {
      const result = await retry(
        async () =>
          adapter.sendTemplate({
            to: {
              email: p.email as string,
              name: p.handle ?? undefined,
            },
            templateId: config.RENEWAL_TEMPLATE_ID as number,
            params: {
              renews_at: p.renewsAt?.toISOString() ?? null,
              tier: p.tier,
            },
          }),
        { label: "email.renewal_reminder.send", attempts: 2 }
      );

      try {
        await prisma.emailLog.create({
          data: {
            profileId: p.id,
            kind: "renewal_reminder",
            provider: result.provider,
            externalMessageId: result.messageId,
            templateId: String(config.RENEWAL_TEMPLATE_ID),
          },
        });
      } catch (insertErr) {
        logger.error(
          { err: String(insertErr), profileId: p.id },
          "renewal-reminder: email sent but email_log insert failed"
        );
      }

      sent++;
    } catch (err) {
      errors++;
      Sentry.captureException(err, {
        tags: { scope: "renewal-reminder.send" },
        extra: { profileId: p.id },
      });
      logger.error(
        { err: String(err), profileId: p.id },
        "renewal-reminder: send failed"
      );
    }
  }

  logger.info(
    { total: candidates.length, sent, skipped, errors },
    "renewal-reminder: run end"
  );
}
