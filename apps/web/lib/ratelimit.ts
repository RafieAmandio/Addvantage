import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { serverConfig } from "@/lib/config/server";

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

let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = serverConfig.UPSTASH_REDIS_REST_URL;
  const token = serverConfig.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisClient = null;
    return null;
  }
  redisClient = new Redis({ url, token });
  return redisClient;
}

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
