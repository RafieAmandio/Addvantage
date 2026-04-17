import { getRedis } from "@/lib/redis";

if (typeof window !== "undefined") {
  throw new Error("lib/cache.ts is server-only");
}

/**
 * Fetch a JSON-serialised value from Redis. Returns `null` when:
 *  - Upstash env is unset (no-op)
 *  - the key is missing
 *  - the stored payload fails to parse
 *
 * The caller is responsible for narrowing / validating `T` (e.g. via Zod).
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  const raw = await redis.get<unknown>(key);
  if (raw === null || raw === undefined) return null;

  // Upstash SDK auto-decodes JSON — if we already got an object, return it.
  if (typeof raw !== "string") {
    return raw as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Store a JSON-serialised value in Redis with TTL (seconds).
 * No-op when Upstash env is unset.
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSec: number,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  await redis.set(key, JSON.stringify(value), { ex: ttlSec });
}
