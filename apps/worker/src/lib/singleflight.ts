/**
 * Single-flight coalescing via Upstash Redis (REST).
 *
 * Ports the pattern from `apps/web/lib/singleflight.ts`. Concurrent callers
 * with the same `key` collapse onto a single `fetcher()` execution: the
 * winner runs the fetcher and writes the result to `sf:cache:{key}` with
 * TTL `ttlSec`; losers poll the cache every 200ms up to `ttlSec` seconds.
 *
 * When Upstash env is unset this degrades to a direct `fetcher()` call
 * with no coalescing (and no Redis dependency at runtime).
 *
 * Worker rule: all `process.env` reads live in `lib/config.ts`. We go
 * through `config` rather than reading env directly.
 */
import { Redis } from "@upstash/redis";
import { config } from "./config";
import { logger } from "./logger";

const POLL_INTERVAL_MS = 200;

let cachedClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (cachedClient !== undefined) return cachedClient;

  const url = config.UPSTASH_REDIS_REST_URL;
  const token = config.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = new Redis({ url, token });
  return cachedClient;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readCache<T>(redis: Redis, cacheKey: string): Promise<T | null> {
  const raw = await redis.get<unknown>(cacheKey);
  if (raw === null || raw === undefined) return null;

  // Upstash SDK auto-decodes JSON — if we already got a non-string, return as-is.
  if (typeof raw !== "string") return raw as T;

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    logger.warn({ err: error, scope: "singleflight.readCache", cacheKey },
      "singleflight cache payload failed to parse",
    );
    return null;
  }
}

/**
 * Coalesce concurrent callers onto a single execution of `fetcher`, keyed by
 * `key`. The winner runs `fetcher`, writes to `sf:cache:{key}` with TTL
 * `ttlSec`, then releases the lock. Losers poll the cache every 200ms up to
 * `ttlSec` seconds and return the cached value once present. If TTL elapses
 * with no cache hit, we fall through to `fetcher()` rather than deadlock.
 */
export async function singleflight<T>(
  key: string,
  ttlSec: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();
  if (!redis) return fetcher();

  const lockKey = `sf:lock:${key}`;
  const cacheKey = `sf:cache:${key}`;

  // SET lockKey 1 NX EX ttlSec
  const acquired = await redis.set(lockKey, "1", { nx: true, ex: ttlSec });

  if (acquired === "OK") {
    try {
      const result = await fetcher();
      await redis.set(cacheKey, JSON.stringify(result), { ex: ttlSec });
      return result;
    } finally {
      await redis.del(lockKey);
    }
  }

  // Another caller holds the lock — poll the cache.
  const deadline = Date.now() + ttlSec * 1000;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    const cached = await readCache<T>(redis, cacheKey);
    if (cached !== null) return cached;
  }

  // Lock holder never wrote the cache within TTL — fall through and run it
  // ourselves rather than deadlock.
  return fetcher();
}
