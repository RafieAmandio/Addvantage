import { Router } from "express";
import { GiveawayEntrySchema } from "@tradevantage/shared/schema";
import { ipRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { requireAdmin } from "@/core/middleware/admin.middleware.js";
import { validate } from "@/core/middleware/validate.middleware.js";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { giveawayController } from "./giveaway.controller.js";

const router = Router();

// Public submit — no account needed. IP rate-limited + honeypot in the schema.
router.post(
  "/",
  ipRateLimit({ limit: 15, windowSec: 300, action: "giveaway:submit" }),
  validate({ body: GiveawayEntrySchema }),
  giveawayController.submit,
);

// Admin: view entries + draw a winner.
const admin = [requireAuth, asyncHandler(requireAdmin)] as const;
router.get("/admin/entries", ...admin, giveawayController.adminList);
router.post("/admin/draw", ...admin, giveawayController.adminDraw);

export { router as giveawayRoutes };
