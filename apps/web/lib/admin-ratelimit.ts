import { rateLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

/**
 * Shared admin server-action rate-limit gate. Defaults to 30 requests per
 * 60 seconds per `(adminId, action)` pair — matches the original per-file
 * helpers lifted out of `admin/review/[id]/actions.ts` and
 * `features/plan/actions.ts`.
 *
 * Throws `Error("rate_limited")` so call sites can `try { ... } catch`
 * and return their own `{ ok: false, error: "rate_limited" }` shape.
 * Emits `logger.warn` with the provided `scope` so future admin actions
 * share one log channel and no breach goes silent.
 */
export async function enforceAdminRateLimit(
  adminId: string,
  action: string,
  scope: string,
  opts: { limit?: number; windowSec?: number } = {},
): Promise<void> {
  const rl = await rateLimit({
    key: `admin:${adminId}:${action}`,
    limit: opts.limit ?? 30,
    windowSec: opts.windowSec ?? 60,
  });
  if (!rl.success) {
    logger.warn("admin rate-limited", { adminId, action, scope });
    throw new Error("rate_limited");
  }
}
