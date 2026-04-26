import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "@/lib/redis";

if (typeof window !== "undefined") {
  throw new Error("lib/ratelimit.ts is server-only");
}

type RateLimitArgs = {
  key: string;
  limit: number;
  windowSec: number;
};

export type RateLimitResult = {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
};

const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowSec: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const cacheKey = `${limit}:${windowSec}`;
  const existing = limiters.get(cacheKey);
  if (existing) return existing;

  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    analytics: false,
    prefix: "rl",
  });
  limiters.set(cacheKey, rl);
  return rl;
}

export async function rateLimit(
  args: RateLimitArgs,
): Promise<RateLimitResult> {
  const limiter = getLimiter(args.limit, args.windowSec);
  if (!limiter) return { success: true };

  const res = await limiter.limit(args.key);
  return {
    success: res.success,
    limit: res.limit,
    remaining: res.remaining,
    reset: res.reset,
  };
}
