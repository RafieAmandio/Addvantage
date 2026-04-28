import { Router } from "express";
import { ipRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { subscriptionController } from "./subscription.controller.js";

const router = Router();

router.post(
  "/payment",
  ipRateLimit({ limit: 60, windowSec: 60, action: "webhooks:payment" }),
  subscriptionController.handleWebhook,
);

export { router as subscriptionRoutes };
