import type { Request, Response } from "express";
import { prisma } from "@/config/database.js";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { logger } from "@/config/logger.js";

const startedAt = Date.now();

type Check = { ok: true } | { ok: false; error: string };

async function checkDatabase(): Promise<Check> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export const check = asyncHandler(async (_req: Request, res: Response) => {
  const database = await checkDatabase();
  const ok = database.ok;
  const body = {
    ok,
    ts: new Date().toISOString(),
    app: "api",
    uptime_s: Math.round((Date.now() - startedAt) / 1000),
    checks: { database },
  };
  if (!ok) logger.warn(body, "health: degraded");
  res.status(ok ? 200 : 503).json(body);
});
