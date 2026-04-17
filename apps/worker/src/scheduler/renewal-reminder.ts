import { config } from "../lib/config";
import { logger } from "../lib/logger";
import { retry } from "../lib/retry";
import { supabase } from "../lib/supabase";
import { getEmailAdapter, EMAIL_ADAPTERS } from "../adapters/email";

/**
 * E3: Renewal reminder job.
 *
 * Runs daily. Finds profiles whose `tier_renewal_at` falls in a one-day window
 * (6 to 7 days out) and sends a Brevo transactional template. Every successful
 * send is recorded in `email_log` with kind='renewal_reminder' so re-runs
 * within a 7-day window don't double-send.
 *
 * `profiles.email` is a denormalised mirror of `auth.users.email` maintained
 * elsewhere, so this job reads `profiles.email` directly (no auth.users JOIN).
 * Rows with NULL email are silently skipped.
 *
 * Unset EMAIL_PROVIDER → caller should not register the cron at all, but this
 * function is also defensive: if the registry is empty it warns and returns.
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
  const sevenDaysAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Fetch candidate profiles in the renewal window. Bound to tier_renewal_at
  // partial index, so this stays cheap even as profiles grows.
  const { data: profiles, error: profilesErr } = await retry(
    async () =>
      supabase()
        .from("profiles")
        .select("id,email,handle,tier,tier_renewal_at")
        .gte("tier_renewal_at", windowStart.toISOString())
        .lt("tier_renewal_at", windowEnd.toISOString()),
    { label: "supabase.profiles.renewalWindow", attempts: 3 }
  );

  if (profilesErr) {
    logger.error(
      { err: profilesErr.message },
      "renewal-reminder: failed to load profiles"
    );
    return;
  }

  const candidates = profiles ?? [];
  if (candidates.length === 0) {
    logger.info("renewal-reminder: no profiles in window");
    return;
  }

  // Pre-load recent renewal sends to dedupe without per-row round-trips.
  const profileIds = candidates.map((p) => p.id);
  const { data: recentSends, error: sendsErr } = await retry(
    async () =>
      supabase()
        .from("email_log")
        .select("profile_id")
        .eq("kind", "renewal_reminder")
        .gte("sent_at", sevenDaysAgo)
        .in("profile_id", profileIds),
    { label: "supabase.email_log.recentRenewals", attempts: 3 }
  );

  if (sendsErr) {
    logger.error(
      { err: sendsErr.message },
      "renewal-reminder: failed to load recent sends"
    );
    return;
  }

  const alreadySent = new Set(
    (recentSends ?? [])
      .map((r) => r.profile_id as string | null)
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
              tier_renewal_at: p.tier_renewal_at,
              tier: p.tier,
            },
          }),
        { label: "email.renewal_reminder.send", attempts: 2 }
      );

      const { error: insertErr } = await supabase()
        .from("email_log")
        .insert({
          profile_id: p.id,
          kind: "renewal_reminder",
          provider: result.provider,
          external_message_id: result.messageId,
          template_id: String(config.RENEWAL_TEMPLATE_ID),
        });

      if (insertErr) {
        // Don't fail the run — the send already happened. Log loudly.
        logger.error(
          { err: insertErr.message, profileId: p.id },
          "renewal-reminder: email sent but email_log insert failed"
        );
      }

      sent++;
    } catch (err) {
      errors++;
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
