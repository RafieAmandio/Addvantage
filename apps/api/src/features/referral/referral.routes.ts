import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { requireAdmin } from "@/core/middleware/admin.middleware.js";
import { userRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { upload } from "@/core/middleware/upload.middleware.js";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { referralController } from "./referral.controller.js";

const router = Router();

router.get("/partners", requireAuth, userRateLimit({ limit: 30, action: "referral:list" }), referralController.list);

const admin = [requireAuth, asyncHandler(requireAdmin)] as const;
router.get("/admin/partners", ...admin, referralController.adminList);
router.post("/admin/partners", ...admin, referralController.adminCreate);
router.put("/admin/partners/:id", ...admin, referralController.adminUpdate);
router.delete("/admin/partners/:id", ...admin, referralController.adminDelete);
router.post("/admin/upload", ...admin, upload.single("image"), referralController.adminUploadIcon);

export { router as referralRoutes };
