import { Redis } from "@upstash/redis";

if (typeof window !== "undefined") {
  throw new Error("lib/redis.ts is server-only");
}

let cached: Redis | null | undefined;

/**
 * Returns an Upstash Redis REST client, or `null` when either
 * `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` is unset.
 *
 * Consumers should treat `null` as a graceful no-op (do not throw).
 */
export function getRedis(): Redis | null {
  if (cached !== undefined) return cached;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    cached = null;
    return cached;
  }

  cached = new Redis({ url, token });
  return cached;
}
