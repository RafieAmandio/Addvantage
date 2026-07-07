import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { tokenUnlocksController } from "./token-unlocks.controller.js";

const router = Router();

// VIP gate enforced in the service.
router.get("/", requireAuth, tokenUnlocksController.getUpcoming);

export { router as tokenUnlocksRoutes };
