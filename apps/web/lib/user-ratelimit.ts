import { rateLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

/**
 * Shared user server-action rate-limit gate. Mirrors
 * `enforceAdminRateLimit` (tick 156) for flat per-user limits.
 *
 * Defaults to 10 requests per 60 seconds per `(userId, action)` pair.
 * On breach: emits `logger.warn("user rate-limited", { userId, action, scope })`
 * and throws `Error("rate_limited")` so call sites can `try { ... } catch`
 * and return their own `{ ok: false, error: "rate_limited" }` shape.
 *
 * Graceful no-op when Upstash env is unset (inherited from `rateLimit`).
 *
 * NOTE: this helper is for flat per-user limits only. Tier-aware gating
 * (free/vip buckets) lives in `lib/ratelimit-tier.ts` — do not collapse
 * the two. IP-keyed and compound-key gates also remain direct callers
 * of `rateLimit(...)`.
 */
export async function enforceUserRateLimit(
  userId: string,
  action: string,
  opts: { limit?: number; windowSec?: number; scope?: string } = {},
): Promise<void> {
  const scope = opts.scope ?? action;
  const rl = await rateLimit({
    key: `user:${userId}:${action}`,
    limit: opts.limit ?? 10,
    windowSec: opts.windowSec ?? 60,
  });
  if (!rl.success) {
    logger.warn("user rate-limited", { userId, action, scope });
    throw new Error("rate_limited");
  }
}
