import { Router } from "express";
import { EarlyAccessApplicationSchema } from "@tradevantage/shared/schema";
import { ipRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { upload } from "@/core/middleware/upload.middleware.js";
import { validate } from "@/core/middleware/validate.middleware.js";
import { earlyAccessController } from "./early-access.controller.js";

const router = Router();

// Public flow — no account exists yet. Guarded by IP rate-limits + a honeypot
// field in the schema. Amounts are derived server-side, not taken from input.
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

export { router as earlyAccessRoutes };
