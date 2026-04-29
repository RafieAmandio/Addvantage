import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { requireAdmin } from "@/core/middleware/admin.middleware.js";
import { adminRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { validate } from "@/core/middleware/validate.middleware.js";
import { planController } from "./plan.controller.js";
import { planCreateSchema, planUpdateSchema, planCloseSchema } from "./plan.validation.js";

const router = Router();

router.get("/stats", planController.getStats);
router.get("/admin/all", requireAuth, requireAdmin, planController.listAllForAdmin);
router.get("/admin/drafts", requireAuth, requireAdmin, planController.listMyDrafts);
router.get("/admin/:id", requireAuth, requireAdmin, planController.getForAdmin);
router.get("/:id/news", planController.getNewsForPlan);
router.get("/:id", planController.getPublished);
router.get("/", planController.listPublished);

const adminWrite = [requireAuth, requireAdmin, adminRateLimit({ action: "plan" })] as const;

router.post("/", ...adminWrite, validate({ body: planCreateSchema }), planController.create);
router.put("/:id", ...adminWrite, validate({ body: planUpdateSchema }), planController.update);
router.put("/:id/publish", ...adminWrite, planController.publish);
router.put("/:id/close", ...adminWrite, validate({ body: planCloseSchema }), planController.close);
router.delete("/:id", ...adminWrite, planController.remove);

export { router as planRoutes };
