import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { requireAdmin } from "@/core/middleware/admin.middleware.js";
import { ingestionController } from "./ingestion.controller.js";

const router = Router();

router.get("/runs", requireAuth, requireAdmin, ingestionController.listRuns);

export { router as ingestionRoutes };
