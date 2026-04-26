import { getRedis } from "@/lib/redis";
import { logger } from "@/lib/logger";

if (typeof window !== "undefined") {
  throw new Error("lib/cache.ts is server-only");
}

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
  } catch (error) {
    logger.warn("cache payload failed to parse", {
      error,
      scope: "cache.getCache",
      key,
    });
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSec: number,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  await redis.set(key, JSON.stringify(value), { ex: ttlSec });
}
