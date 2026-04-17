import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { verifyXenditWebhook } from "@/lib/payment/verify-xendit";
import { rateLimit } from "@/lib/ratelimit";
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

  const rl = await rateLimit({
    key: `webhooks:xendit:${ip}`,
    limit: 60,
    windowSec: 60,
  });
  if (!rl.success) {
    const retryAfter = rl.reset
      ? Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000))
      : 60;
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "Cache-Control": "no-store",
        },
      }
    );
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
