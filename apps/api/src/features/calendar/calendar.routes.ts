import { Router } from "express";
import type { Request } from "express";
import { optionalAuth } from "@/core/middleware/auth.middleware.js";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { tierRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import type { AuthUser } from "@/core/types/request.js";
import { calendarController } from "./calendar.controller.js";

const router = Router();

const getTier = (req: Request) => {
  const user = (req as Request & { user?: AuthUser & { tier?: string } }).user;
  return user?.tier === "vip" ? ("vip" as const) : ("free" as const);
};

router.get("/", optionalAuth, tierRateLimit("api:events", getTier), calendarController.listEvents);
router.get("/:id/correlation", requireAuth, calendarController.getCorrelation);

export { router as calendarRoutes };
