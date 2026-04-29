import * as Sentry from "@sentry/node";
import { prisma } from "@tradevantage/db";
import { config } from "../lib/config";
import { logger } from "../lib/logger";
import { retry } from "../lib/retry";
import { getEmailAdapter, EMAIL_ADAPTERS } from "../adapters/email";

function buildRenewalEmail(tier: string, renewsAt: string): { subject: string; html: string } {
  const renewDate = new Date(renewsAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<style>
body{margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.c{max-width:560px;margin:0 auto;padding:40px 20px}
.card{background:#fff;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.h{text-align:center;margin-bottom:24px}.h h1{margin:0;font-size:20px;color:#6366f1;font-weight:700}
.b{color:#27272a;font-size:15px;line-height:1.6}.b p{margin:0 0 16px}
.f{text-align:center;margin-top:24px;color:#a1a1aa;font-size:12px}
</style></head><body><div class="c"><div class="card">
<div class="h"><h1>TradeVantage</h1></div>
<div class="b">
<p>Your <strong>${tier}</strong> subscription is renewing on <strong>${renewDate}</strong>.</p>
<p>No action is needed if you'd like to continue. If you want to change or cancel your plan, please do so before the renewal date.</p>
</div></div>
<div class="f">&copy; ${new Date().getFullYear()} TradeVantage</div>
</div></body></html>`;

  return {
    subject: `Your ${tier} plan renews on ${renewDate}`,
    html,
  };
}

/**
 * E3: Renewal reminder job.
 *
 * Runs daily. Finds profiles whose `renews_at` falls in a one-day window
 * (6 to 7 days out) and sends an HTML email. Every successful send is
 * recorded in `email_log` with kind='renewal_reminder' so re-runs within
 * a 7-day window don't double-send.
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
      const { subject, html } = buildRenewalEmail(
        p.tier,
        p.renewsAt?.toISOString() ?? new Date().toISOString(),
      );

      const result = await retry(
        async () =>
          adapter.sendRaw({
            to: {
              email: p.email as string,
              name: p.handle ?? undefined,
            },
            subject,
            html,
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
