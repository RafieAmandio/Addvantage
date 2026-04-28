import { rateLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

export async function enforceUserRateLimit(
  userId: string,
  action: string,
  opts: {
    limit?: number;
    windowSec?: number;
    scope?: string;
    keySuffix?: string;
  } = {},
): Promise<void> {
  const scope = opts.scope ?? action;
  const base = `user:${userId}:${action}`;
  const key = opts.keySuffix ? `${base}:${opts.keySuffix}` : base;
  const rl = await rateLimit({
    key,
    limit: opts.limit ?? 10,
    windowSec: opts.windowSec ?? 60,
  });
  if (!rl.success) {
    logger.warn("user rate-limited", {
      userId,
      action,
      scope,
      keySuffix: opts.keySuffix,
    });
    throw new Error("rate_limited");
  }
}
