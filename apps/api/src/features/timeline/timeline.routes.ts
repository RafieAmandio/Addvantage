import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { userRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { validate } from "@/core/middleware/validate.middleware.js";
import { timelineController } from "./timeline.controller.js";
import { timelineQuerySchema, createPinSchema } from "./timeline.validation.js";

const router = Router();

router.get("/", validate({ query: timelineQuerySchema }), timelineController.list);
router.get("/:id", timelineController.getById);
router.post("/pin", requireAuth, userRateLimit({ limit: 10, action: "timeline:pin" }), validate({ body: createPinSchema }), timelineController.createPin);

export { router as timelineRoutes };
