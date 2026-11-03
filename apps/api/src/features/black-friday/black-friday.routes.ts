import { Router } from "express";
import {
  BlackFridayApplicationSchema,
  BlackFridayDinnerSchema,
  BlackFridayDraftSchema,
  BlackFridayRejectSchema,
} from "@tradevantage/shared/schema";
import { ipRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { requireAdmin } from "@/core/middleware/admin.middleware.js";
import { upload } from "@/core/middleware/upload.middleware.js";
import { validate } from "@/core/middleware/validate.middleware.js";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { blackFridayController } from "./black-friday.controller.js";

const router = Router();

// Public flow, same guards as early access: IP rate limits plus a honeypot in the schema.
router.post(
  "/draft",
  ipRateLimit({ limit: 30, windowSec: 300, action: "black-friday:draft" }),
  validate({ body: BlackFridayDraftSchema }),
  blackFridayController.draft,
);

router.post(
  "/upload-proof",
  ipRateLimit({ limit: 20, windowSec: 300, action: "black-friday:upload" }),
  upload.single("image"),
  blackFridayController.uploadProof,
);

router.post(
  "/",
  ipRateLimit({ limit: 10, windowSec: 300, action: "black-friday:submit" }),
  validate({ body: BlackFridayApplicationSchema }),
  blackFridayController.submit,
);

const admin = [requireAuth, asyncHandler(requireAdmin)] as const;
router.get("/admin/applications", ...admin, blackFridayController.adminList);
router.get("/admin/:id/proof-url/:kind", ...admin, blackFridayController.adminProofUrl);
router.post("/admin/:id/approve", ...admin, blackFridayController.adminApprove);
router.post("/admin/:id/reject", ...admin, validate({ body: BlackFridayRejectSchema }), blackFridayController.adminReject);
router.post("/admin/:id/dinner", ...admin, validate({ body: BlackFridayDinnerSchema }), blackFridayController.adminDinner);

export { router as blackFridayRoutes };
