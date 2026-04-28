import { rateLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

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
