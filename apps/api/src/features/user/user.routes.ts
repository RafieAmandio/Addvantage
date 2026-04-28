import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { userRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { userController } from "./user.controller.js";

const router = Router();

router.get("/me", requireAuth, userController.getMe);
router.put("/profile", requireAuth, userRateLimit({ limit: 5, action: "profile:save" }), userController.updateProfile);

export { router as userRoutes };
