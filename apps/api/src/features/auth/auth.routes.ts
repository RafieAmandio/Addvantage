import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { authController } from "./auth.controller.js";

const router = Router();

router.post("/logout", requireAuth, authController.logout);

export { router as authRoutes };
