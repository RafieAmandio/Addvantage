import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { userRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { timelineController } from "./timeline.controller.js";

const router = Router();

router.get("/", timelineController.list);
router.get("/:id", timelineController.getById);
router.post("/pin", requireAuth, userRateLimit({ limit: 10, action: "timeline:pin" }), timelineController.createPin);

export { router as timelineRoutes };
