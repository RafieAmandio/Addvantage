import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { upgradeRadarController } from "./upgrade-radar.controller.js";

const router = Router();

// VIP gate enforced in the service.
router.get("/", requireAuth, upgradeRadarController.getUpcoming);

export { router as upgradeRadarRoutes };
