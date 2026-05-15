import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { requireAdmin } from "@/core/middleware/admin.middleware.js";
import { userRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { validate } from "@/core/middleware/validate.middleware.js";
import { userController } from "./user.controller.js";
import { updateProfileSchema } from "./user.validation.js";

const router = Router();

router.get("/me", requireAuth, userController.getMe);
router.get("/admin/all", requireAuth, requireAdmin, userController.listAll);
router.put("/profile", requireAuth, userRateLimit({ limit: 5, action: "profile:save" }), validate({ body: updateProfileSchema }), userController.updateProfile);

export { router as userRoutes };
