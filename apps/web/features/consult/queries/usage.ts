import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
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

// Loose schema at the DB boundary — `consult_messages.metadata` is `Json` and
// each row's metadata shape is intentionally flexible (see tick-154 notes).
// We only care about `total_tokens` here; everything else passes through.
const MetadataTokenShape = z
  .object({
    total_tokens: z.number().nonnegative().optional(),
  })
  .passthrough();

/**
 * Sum `metadata.total_tokens` across the caller's `consult_messages` rows
 * created in the last 24 hours. RLS on `consult_messages` restricts reads
 * to the authenticated user's rows, so the `user_id` filter here is
 * defence-in-depth rather than the primary guard.
 *
 * Fail-open: on any error we log loudly and return 0 so a broken query does
 * not DOS paying users. The tier-aware per-minute limiter still applies as a
 * secondary brake.
 */
export async function getDailyTokensUsed(userId: string): Promise<number> {
  const supabase = supabaseServer();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("consult_messages")
    .select("metadata")
    .eq("user_id", userId)
    .gte("created_at", since);

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

  let total = 0;
  for (const row of data ?? []) {
    const raw = (row as { metadata: unknown }).metadata;
    if (raw == null || typeof raw !== "object") continue;
    const parsed = MetadataTokenShape.safeParse(raw);
    if (!parsed.success) continue;
    const t = parsed.data.total_tokens;
    if (typeof t === "number" && Number.isFinite(t)) {
      total += t;
    }
  }
  return total;
}
