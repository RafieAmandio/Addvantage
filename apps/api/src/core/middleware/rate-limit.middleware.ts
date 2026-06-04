import { Ratelimit } from "@upstash/ratelimit";
import type { Request, Response, NextFunction } from "express";
import { getRedis } from "../../config/redis.js";
import { logger } from "../../config/logger.js";
import { AppError } from "../errors/index.js";
import type { AuthUser } from "../types/request.js";

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

async function enforce(key: string, limit: number, windowSec: number): Promise<boolean> {
  const limiter = getLimiter(limit, windowSec);
  if (!limiter) return true;
  const res = await limiter.limit(key);
  return res.success;
}

function getIp(req: Request): string {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip ?? "unknown";
}

export function ipRateLimit(opts: { limit?: number; windowSec?: number; action?: string } = {}) {
  const limit = opts.limit ?? 60;
  const windowSec = opts.windowSec ?? 60;
  const action = opts.action ?? "global";

  return async (req: Request, _res: Response, next: NextFunction) => {
    const ip = getIp(req);
    const ok = await enforce(`ip:${ip}:${action}`, limit, windowSec);
    if (!ok) {
      logger.warn({ ip, action }, "ip rate-limited");
      throw new AppError("Too many requests", 429);
    }
    next();
  };
}

export function userRateLimit(opts: { limit?: number; windowSec?: number; action?: string } = {}) {
  const limit = opts.limit ?? 10;
  const windowSec = opts.windowSec ?? 60;
  const action = opts.action ?? "global";

  return async (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: AuthUser }).user;
    if (!user) return next();
    const ok = await enforce(`user:${user.id}:${action}`, limit, windowSec);
    if (!ok) {
      logger.warn({ userId: user.id, action }, "user rate-limited");
      throw new AppError("Too many requests", 429);
    }
    next();
  };
}

export type Tier = "free" | "vip";
type TierAction = "consult:send" | "api:bars" | "api:events" | "api:rsi" | "api:atr" | "api:gap";

const TIER_BUCKETS: Record<TierAction, Record<Tier, { limit: number; windowSec: number }>> = {
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
  "api:rsi": {
    free: { limit: 30, windowSec: 60 },
    vip: { limit: 120, windowSec: 60 },
  },
  "api:atr": {
    free: { limit: 30, windowSec: 60 },
    vip: { limit: 120, windowSec: 60 },
  },
  "api:gap": {
    free: { limit: 30, windowSec: 60 },
    vip: { limit: 120, windowSec: 60 },
  },
};

export function tierRateLimit(action: TierAction, getTier?: (req: Request) => Tier) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: AuthUser }).user;
    const tier: Tier = getTier ? getTier(req) : "free";
    const bucket = TIER_BUCKETS[action][tier];
    const key = user ? `tier:${action}:${user.id}` : `tier:${action}:ip:${getIp(req)}`;
    const ok = await enforce(key, bucket.limit, bucket.windowSec);
    if (!ok) {
      logger.warn({ action, tier, userId: user?.id }, "tier rate-limited");
      throw new AppError("Too many requests", 429);
    }
    next();
  };
}

export function adminRateLimit(opts: { limit?: number; windowSec?: number; action?: string } = {}) {
  const limit = opts.limit ?? 30;
  const windowSec = opts.windowSec ?? 60;
  const action = opts.action ?? "admin";

  return async (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: AuthUser }).user;
    if (!user) return next();
    const ok = await enforce(`admin:${user.id}:${action}`, limit, windowSec);
    if (!ok) {
      logger.warn({ adminId: user.id, action }, "admin rate-limited");
      throw new AppError("Too many requests", 429);
    }
    next();
  };
}
