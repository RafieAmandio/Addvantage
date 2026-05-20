import { Router } from "express";
import type { Request } from "express";
import { optionalAuth } from "@/core/middleware/auth.middleware.js";
import { tierRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { validate } from "@/core/middleware/validate.middleware.js";
import type { AuthUser } from "@/core/types/request.js";
import { rsiController } from "./rsi.controller.js";
import { rsiHeatmapQuerySchema } from "./rsi.validation.js";

const router = Router();

const getTier = (req: Request) => {
  const user = (req as Request & { user?: AuthUser & { tier?: string } }).user;
  return user?.tier === "vip" ? ("vip" as const) : ("free" as const);
};

router.get(
  "/heatmap",
  optionalAuth,
  tierRateLimit("api:rsi", getTier),
  validate({ query: rsiHeatmapQuerySchema }),
  rsiController.getHeatmap,
);

export { router as rsiRoutes };
