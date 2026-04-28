import { rateLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

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
