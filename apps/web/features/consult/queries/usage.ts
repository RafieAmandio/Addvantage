import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";
import { supabaseServer } from "@/lib/supabase/server";

if (typeof window !== "undefined") {
  throw new Error("features/consult/queries/usage.ts is server-only");
}

/**
 * RT3 daily token budget. Free tier is capped at 10k tokens per rolling 24h
 * window; VIP is unbounded. The number is a conservative starting point —
 * tune alongside the per-minute rate in `lib/ratelimit-tier.ts`.
 *
 * Exported as a constant so the actions layer and the stream route can gate
 * consistently without duplicating the literal.
 */
export const FREE_DAILY_TOKEN_CAP = 10_000;

/**
 * Sum `metadata.total_tokens` across the caller's `consult_messages` rows
 * created in the last 24 hours via the `get_consult_daily_tokens_used()`
 * SECURITY DEFINER RPC (migration 0024). The RPC filters to `auth.uid()`
 * server-side so every caller sees only their own total.
 *
 * Before tick 194 this pulled every metadata JSONB over the wire and summed
 * in-app; now it's one bigint per call.
 *
 * Fail-open: on any error we log loudly and return 0 so a broken query does
 * not DOS paying users. The tier-aware per-minute limiter still applies as a
 * secondary brake.
 */
export async function getDailyTokensUsed(userId: string): Promise<number> {
  const supabase = supabaseServer();
  const { data, error } = await supabase.rpc("get_consult_daily_tokens_used");

  if (error) {
    Sentry.captureException(error, {
      tags: { scope: "consult.usage" },
      extra: { userId },
    });
    logger.error("getDailyTokensUsed failed", {
      error,
      userId,
      scope: "consult.usage",
    });
    return 0;
  }

  const raw = typeof data === "number" ? data : Number(data);
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
}
