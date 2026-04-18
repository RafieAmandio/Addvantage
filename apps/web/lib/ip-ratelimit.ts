import { rateLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

/**
 * Shared IP-keyed rate-limit gate — the per-IP twin of
 * `enforceUserRateLimit` (tick 189). Used on endpoints where we don't
 * have (or don't trust) a user id, e.g. webhook receivers.
 *
 * Defaults to 60 requests per 60 seconds per `(ip, action)` pair.
 * On breach: emits `logger.warn("ip rate-limited", { ip, action, scope })`
 * and throws `Error("rate_limited")` so call sites can `try { ... } catch`
 * and return their own 429 (or action-state) shape.
 *
 * Graceful no-op when Upstash env is unset (inherited from `rateLimit`).
 *
 * Kept as a sibling helper rather than merged into `enforceUserRateLimit`
 * so each log payload carries the correct identifier (userId vs ip) and
 * call sites can't accidentally swap the two.
 */
export async function enforceIpRateLimit(
  ip: string,
  action: string,
  opts: { limit?: number; windowSec?: number; scope?: string } = {},
): Promise<void> {
  const scope = opts.scope ?? action;
  const rl = await rateLimit({
    key: `ip:${ip}:${action}`,
    limit: opts.limit ?? 60,
    windowSec: opts.windowSec ?? 60,
  });
  if (!rl.success) {
    logger.warn("ip rate-limited", { ip, action, scope });
    throw new Error("rate_limited");
  }
}
