import { logger } from "@/lib/logger";
import { rateLimit, type RateLimitResult } from "@/lib/ratelimit";

if (typeof window !== "undefined") {
  throw new Error("lib/ratelimit-tier.ts is server-only");
}

/**
 * Tier-aware rate-limit wrapper on top of `rateLimit()`. Central place to
 * tweak per-tier budgets going forward (RT2/RT4 wire the consult + API
 * routes through this helper). Inherits the graceful no-op behaviour
 * when Upstash is unset.
 *
 * Actions so far: `"consult:send"`, `"api:bars"`, `"api:events"`. Add new
 * actions here rather than duplicating bucket tables at call sites.
 */

export type Tier = "free" | "vip";

type TierAction = "consult:send" | "api:bars" | "api:events";

interface Bucket {
  limit: number;
  windowSec: number;
}

/**
 * Per-(action, tier) bucket table. Free stays behind a cheap cap so the
 * LLM/upstream-API cost stays bounded; VIP gets room to actually use the
 * desk. Keep this the single source of truth — tests and dashboards can
 * import `TIER_BUCKETS` for visibility.
 */
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

/**
 * Enforce the tier-specific bucket for `action`. The Redis key is namespaced
 * by action + user id so shifting a user between tiers does not reset their
 * existing bucket (the sliding window keeps applying). Window is per-tier
 * so the reset cadence also differs by tier.
 *
 * RT4: accepts an anonymous `{ ip, action }` variant for public routes
 * (/api/bars, /api/events). Anonymous callers get the conservative `free`
 * bucket under a separate `tier:<action>:ip:<ip>` key — the authed key shape
 * (`tier:<action>:<userId>`) stays unchanged so existing RT2 sliding windows
 * don't reset on deploy.
 */
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
