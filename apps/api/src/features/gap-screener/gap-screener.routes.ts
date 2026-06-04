import { Router } from "express";
import type { Request } from "express";
import { optionalAuth } from "@/core/middleware/auth.middleware.js";
import { tierRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import type { AuthUser } from "@/core/types/request.js";
import { gapScreenerController } from "./gap-screener.controller.js";

const router = Router();

const getTier = (req: Request) => {
  const user = (req as Request & { user?: AuthUser & { tier?: string } }).user;
  return user?.tier === "vip" ? ("vip" as const) : ("free" as const);
};

router.get(
  "/scanner",
  optionalAuth,
  tierRateLimit("api:gap", getTier),
  gapScreenerController.getScanner,
);

export { router as gapScreenerRoutes };
