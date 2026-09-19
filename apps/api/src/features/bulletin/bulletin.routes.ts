import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { requireAdmin } from "@/core/middleware/admin.middleware.js";
import { adminRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { validate } from "@/core/middleware/validate.middleware.js";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { bulletinIngestAuth } from "@/core/middleware/bulletin-ingest.middleware.js";
import {
  bulletinCreateSchema,
  bulletinUpdateSchema,
  bulletinLevelUpsertSchema,
  bulletinIngestSchema,
} from "@tradevantage/shared/schema";
import { bulletinController } from "./bulletin.controller.js";

const router = Router();

// ─── read (members) ────────────────────────────────────────────────────
router.get("/", requireAuth, bulletinController.list);
router.get("/admin/:id", requireAuth, asyncHandler(requireAdmin), bulletinController.getForAdmin);

// ─── write (admin) ─────────────────────────────────────────────────────
const adminWrite = [requireAuth, asyncHandler(requireAdmin), adminRateLimit({ action: "bulletin" })] as const;

router.post("/", ...adminWrite, validate({ body: bulletinCreateSchema }), bulletinController.create);
router.put("/:id", ...adminWrite, validate({ body: bulletinUpdateSchema }), bulletinController.update);
router.put("/:id/level", ...adminWrite, validate({ body: bulletinLevelUpsertSchema }), bulletinController.upsertLevel);
router.delete("/:id", ...adminWrite, bulletinController.delete);

// ─── ingest (Jeff / trusted server-side callers) ───────────────────────
// Static Bearer token (BULLETIN_INGEST_TOKEN); no user JWT.
router.post("/ingest", bulletinIngestAuth, validate({ body: bulletinIngestSchema }), bulletinController.ingest);

export { router as bulletinRoutes };
