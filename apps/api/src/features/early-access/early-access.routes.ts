import { Router } from "express";
import {
  EarlyAccessApplicationSchema,
  EarlyAccessLeadSchema,
} from "@tradevantage/shared/schema";
import { ipRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { requireAdmin } from "@/core/middleware/admin.middleware.js";
import { upload } from "@/core/middleware/upload.middleware.js";
import { validate } from "@/core/middleware/validate.middleware.js";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { earlyAccessController } from "./early-access.controller.js";

const router = Router();

// Public flow — no account exists yet. Guarded by IP rate-limits + a honeypot
// field in the schema. Amounts are derived server-side, not taken from input.

// Identity step: capture the lead (email + telegram) as a draft immediately.
router.post(
  "/lead",
  ipRateLimit({ limit: 30, windowSec: 300, action: "early-access:lead" }),
  validate({ body: EarlyAccessLeadSchema }),
  earlyAccessController.lead,
);

router.post(
  "/upload-proof",
  ipRateLimit({ limit: 20, windowSec: 300, action: "early-access:upload" }),
  upload.single("image"),
  earlyAccessController.uploadProof,
);

router.post(
  "/",
  ipRateLimit({ limit: 10, windowSec: 300, action: "early-access:submit" }),
  validate({ body: EarlyAccessApplicationSchema }),
  earlyAccessController.submit,
);

// Admin: review paid applications and provision accounts. Admin-only.
const admin = [requireAuth, asyncHandler(requireAdmin)] as const;
router.get("/admin/applications", ...admin, earlyAccessController.adminList);
router.get("/admin/:id/proof-url", ...admin, earlyAccessController.adminProofUrl);
router.post("/admin/:id/provision", ...admin, earlyAccessController.adminProvision);

export { router as earlyAccessRoutes };
