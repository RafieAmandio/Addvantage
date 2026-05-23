import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { validate } from "@/core/middleware/validate.middleware.js";
import { ipRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { authController } from "./auth.controller.js";
import { registerSchema, loginSchema } from "./auth.validation.js";

const router = Router();

router.post(
  "/register",
  ipRateLimit({ limit: 5, windowSec: 60, action: "auth:register" }),
  validate({ body: registerSchema }),
  authController.register,
);

router.post(
  "/login",
  ipRateLimit({ limit: 10, windowSec: 60, action: "auth:login" }),
  validate({ body: loginSchema }),
  authController.login,
);

router.get("/verify-email", authController.verifyEmail);

router.post(
  "/resend-verification",
  requireAuth,
  ipRateLimit({ limit: 3, windowSec: 60, action: "auth:resend-verification" }),
  authController.resendVerification,
);

router.post("/service-token", authController.serviceToken);

router.post("/refresh", requireAuth, authController.refresh);
router.post(
  "/refresh-token",
  ipRateLimit({ limit: 10, windowSec: 60, action: "auth:refresh-token" }),
  authController.refreshToken,
);
router.post("/logout", requireAuth, authController.logout);

export { router as authRoutes };
