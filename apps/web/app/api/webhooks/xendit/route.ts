import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { serverConfig } from "@/lib/config/server";
import { sendBrevoTemplate } from "@/lib/email/brevo";
import { enforceIpRateLimit } from "@/lib/ip-ratelimit";
import { logger } from "@/lib/logger";
import { verifyXenditWebhook } from "@/lib/payment/verify-xendit";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Xendit webhook receiver. Verifies the static `x-callback-token` header,
 * parses the invoice callback, and on `checkout_completed` updates
 * `profiles.tier` via the service-role client (RLS would otherwise block
 * writes against another user's profile).
 *
 * Status codes:
 *   200 → verified, handled (or intentionally ignored non-terminal kinds)
 *   400 → valid signature but missing profile_id / tier metadata
 *   401 → invalid or missing signature header
 *   429 → rate limited (per IP)
 *   500 → DB error while updating profile
 *   503 → XENDIT_WEBHOOK_TOKEN not configured
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    await enforceIpRateLimit(ip, "webhooks:xendit", {
      limit: 60,
      windowSec: 60,
      scope: "api.webhooks.xendit",
    });
  } catch (err) {
    if (err instanceof Error && err.message === "rate_limited") {
      return NextResponse.json(
        { error: "rate_limited" },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "Cache-Control": "no-store",
          },
        }
      );
    }
    throw err;
  }

  const rawBody = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const result = verifyXenditWebhook({ rawBody, headers });

  if (!result.valid) {
    if (result.reason === "not_configured") {
      logger.warn("xendit webhook hit but XENDIT_WEBHOOK_TOKEN unset", {
        scope: "api.webhooks.xendit",
      });
      return NextResponse.json(
        { error: "webhook_not_configured" },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }
    if (result.reason === "bad_json") {
      logger.warn("xendit webhook bad json body", {
        scope: "api.webhooks.xendit",
      });
      return NextResponse.json(
        { error: "bad_json" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }
    if (result.reason === "bad_payload") {
      logger.warn("xendit webhook bad payload", {
        scope: "api.webhooks.xendit",
      });
      return NextResponse.json(
        { error: "bad_payload" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }
    // bad_token (or no token header)
    logger.warn("xendit webhook bad signature", {
      scope: "api.webhooks.xendit",
      ip,
    });
    return NextResponse.json(
      { error: "invalid_signature" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { event } = result;

  // payment_failed → send a dunning email before 200'ing. All graceful
  // no-op paths still return 200 so Xendit stops retrying (these are user
  // / config issues, not transient infra failures).
  if (event.kind === "payment_failed") {
    return handlePaymentFailed(event);
  }

  // Only tier upgrades/downgrades affect profiles; other kinds are logged
  // and 200'd so Xendit stops retrying. Renewals/cancellations will be
  // wired in a follow-up tick.
  if (event.kind !== "checkout_completed") {
    logger.info("xendit webhook non-terminal event", {
      scope: "api.webhooks.xendit",
      kind: event.kind,
      externalRef: event.externalRef,
    });
    return NextResponse.json(
      { received: true, ignored: event.kind },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!event.profileId || !event.tier) {
    logger.warn("xendit webhook missing profile metadata", {
      scope: "api.webhooks.xendit",
      externalRef: event.externalRef,
      hasProfileId: Boolean(event.profileId),
      hasTier: Boolean(event.tier),
    });
    return NextResponse.json(
      { error: "missing_metadata" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const admin = supabaseAdmin();
    const { error } = await admin
      .from("profiles")
      .update({ tier: event.tier })
      .eq("id", event.profileId);

    if (error) {
      logger.error("xendit webhook profile update failed", {
        scope: "api.webhooks.xendit",
        externalRef: event.externalRef,
        profileId: event.profileId,
        tier: event.tier,
        error,
      });
      return NextResponse.json(
        { error: "db_error" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    logger.info("xendit webhook tier updated", {
      scope: "api.webhooks.xendit",
      externalRef: event.externalRef,
      profileId: event.profileId,
      tier: event.tier,
    });
    return NextResponse.json(
      { received: true },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    Sentry.captureException(err, {
      tags: { scope: "api.webhooks.xendit" },
      extra: { externalRef: event.externalRef },
    });
    logger.error("xendit webhook handler threw", {
      scope: "api.webhooks.xendit",
      externalRef: event.externalRef,
      error: err,
    });
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

type VerifiedPaymentEvent = Extract<
  ReturnType<typeof verifyXenditWebhook>,
  { valid: true }
>["event"];

/**
 * Handle a verified `payment_failed` event: DM the affected user a dunning
 * email and log the send. Every failure path still returns 200 to prevent
 * Xendit retries — we've already acknowledged receipt, and the user/config
 * issues here aren't fixed by replaying the webhook.
 */
async function handlePaymentFailed(
  event: VerifiedPaymentEvent
): Promise<NextResponse> {
  const okResponse = (data: Record<string, unknown>) =>
    NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });

  if (!event.profileId) {
    logger.warn("xendit payment_failed: missing profile_id metadata", {
      scope: "api.webhooks.xendit",
      externalRef: event.externalRef,
    });
    return okResponse({
      received: true,
      sent: false,
      reason: "missing_profile_id",
    });
  }

  const templateId = serverConfig.DUNNING_TEMPLATE_ID;
  if (!templateId) {
    logger.warn("xendit payment_failed: DUNNING_TEMPLATE_ID unset", {
      scope: "api.webhooks.xendit",
      externalRef: event.externalRef,
      profileId: event.profileId,
    });
    return okResponse({
      received: true,
      sent: false,
      reason: "template_unset",
    });
  }

  const admin = supabaseAdmin();

  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("email,handle,tier")
    .eq("id", event.profileId)
    .single();

  if (profileErr || !profile) {
    logger.warn("xendit payment_failed: profile lookup failed", {
      scope: "api.webhooks.xendit",
      externalRef: event.externalRef,
      profileId: event.profileId,
      error: profileErr ?? undefined,
    });
    return okResponse({
      received: true,
      sent: false,
      reason: "profile_not_found",
    });
  }

  if (!profile.email) {
    logger.warn("xendit payment_failed: profile email missing", {
      scope: "api.webhooks.xendit",
      externalRef: event.externalRef,
      profileId: event.profileId,
    });
    return okResponse({
      received: true,
      sent: false,
      reason: "email_missing",
    });
  }

  try {
    const result = await sendBrevoTemplate({
      to: {
        email: profile.email,
        name: profile.handle ?? undefined,
      },
      templateId,
      params: {
        tier: profile.tier,
        externalRef: event.externalRef,
        occurredAt: event.occurredAt.toISOString(),
      },
    });

    if (!result) {
      return okResponse({
        received: true,
        sent: false,
        reason: "email_provider_unset",
      });
    }

    const { error: insertErr } = await admin.from("email_log").insert({
      profile_id: event.profileId,
      kind: "dunning",
      provider: result.provider,
      external_message_id: result.messageId,
      template_id: String(templateId),
      payload: JSON.parse(
        JSON.stringify({
          externalRef: event.externalRef,
          raw: event.raw ?? null,
        })
      ),
    });

    if (insertErr) {
      // Send already happened — log loudly but don't fail the webhook.
      logger.error(
        "xendit payment_failed: email_log insert failed (send succeeded)",
        {
          scope: "api.webhooks.xendit",
          externalRef: event.externalRef,
          profileId: event.profileId,
          error: insertErr,
        }
      );
    }

    logger.info("xendit payment_failed: dunning email sent", {
      scope: "api.webhooks.xendit",
      externalRef: event.externalRef,
      profileId: event.profileId,
      messageId: result.messageId,
    });

    return okResponse({ received: true, sent: true });
  } catch (err) {
    logger.error("xendit payment_failed: send failed", {
      scope: "api.webhooks.xendit",
      externalRef: event.externalRef,
      profileId: event.profileId,
      error: err,
    });
    return okResponse({
      received: true,
      sent: false,
      reason: "send_error",
    });
  }
}
