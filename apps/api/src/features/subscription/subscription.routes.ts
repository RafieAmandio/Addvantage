import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { ipRateLimit, userRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { subscriptionController } from "./subscription.controller.js";

const router = Router();

router.post(
  "/payment",
  ipRateLimit({ limit: 60, windowSec: 60, action: "webhooks:payment" }),
  subscriptionController.handleWebhook,
);

router.get(
  "/status",
  requireAuth,
  userRateLimit({ limit: 30, action: "subscription:status" }),
  subscriptionController.getStatus,
);

router.get(
  "/history",
  requireAuth,
  userRateLimit({ limit: 20, action: "subscription:history" }),
  subscriptionController.getHistory,
);

export { router as subscriptionRoutes };
