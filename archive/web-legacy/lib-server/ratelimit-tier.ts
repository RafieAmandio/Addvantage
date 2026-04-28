import { logger } from "@/lib/logger";
import { rateLimit, type RateLimitResult } from "@/lib/ratelimit";

if (typeof window !== "undefined") {
  throw new Error("lib/ratelimit-tier.ts is server-only");
}

export type Tier = "free" | "vip";

type TierAction = "consult:send" | "api:bars" | "api:events";

interface Bucket {
  limit: number;
  windowSec: number;
}

const TIER_BUCKETS: Record<TierAction, Record<Tier, Bucket>> = {
  "consult:send": {
    free: { limit: 5, windowSec: 60 },
    vip: { limit: 30, windowSec: 60 },
  },
  "api:bars": {
    free: { limit: 30, windowSec: 60 },
    vip: { limit: 120, windowSec: 60 },
  },
  "api:events": {
    free: { limit: 60, windowSec: 60 },
    vip: { limit: 240, windowSec: 60 },
  },
};

type EnforceTierRateLimitInput =
  | { userId: string; tier: Tier; action: TierAction }
  | { ip: string; action: TierAction };

export async function enforceTierRateLimit(
  input: EnforceTierRateLimitInput,
): Promise<RateLimitResult> {
  let result: RateLimitResult;
  if ("userId" in input) {
    const bucket = TIER_BUCKETS[input.action][input.tier];
    result = await rateLimit({
      key: `tier:${input.action}:${input.userId}`,
      limit: bucket.limit,
      windowSec: bucket.windowSec,
    });
  } else {
    const bucket = TIER_BUCKETS[input.action].free;
    result = await rateLimit({
      key: `tier:${input.action}:ip:${input.ip}`,
      limit: bucket.limit,
      windowSec: bucket.windowSec,
    });
  }
  if (!result.success) {
    logger.warn("tier rate-limited", {
      action: input.action,
      ...("userId" in input
        ? { userId: input.userId, tier: input.tier }
        : { ip: input.ip, tier: "free" as const }),
      scope: `ratelimit.tier.${input.action}`,
    });
  }
  return result;
}
