import { getRedis } from "@/lib/redis";
import { getCache, setCache } from "@/lib/cache";

if (typeof window !== "undefined") {
  throw new Error("lib/singleflight.ts is server-only");
}

const POLL_INTERVAL_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Coalesce concurrent callers onto a single execution of `fetcher`, keyed by
 * `key`. The winner runs `fetcher`, writes to `cache:{key}` with TTL `ttlSec`,
 * then releases the lock. Losers poll the cache every 200ms up to `ttlSec`
 * seconds and return the cached value once present.
 *
 * When Upstash env is unset (`getRedis()` returns null) this degrades to a
 * direct `fetcher()` call with no coalescing.
 */
export async function singleflight<T>(
  key: string,
  ttlSec: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();
  if (!redis) return fetcher();

  const lockKey = `sf:lock:${key}`;
  const cacheKey = `cache:${key}`;

  // SET lockKey 1 NX EX ttlSec
  const acquired = await redis.set(lockKey, "1", { nx: true, ex: ttlSec });

  if (acquired === "OK") {
    try {
      const result = await fetcher();
      await setCache<T>(cacheKey, result, ttlSec);
      return result;
    } finally {
      await redis.del(lockKey);
    }
  }

  // Another caller holds the lock — poll the cache.
  const deadline = Date.now() + ttlSec * 1000;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    const cached = await getCache<T>(cacheKey);
    if (cached !== null) return cached;
  }

  // Lock holder never wrote the cache within TTL — fall through and run it
  // ourselves rather than deadlock.
  return fetcher();
}
