import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { requireAdmin } from "@/core/middleware/admin.middleware.js";
import { adminRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { validate } from "@/core/middleware/validate.middleware.js";
import { reportsController } from "./reports.controller.js";
import { reportCreateSchema, reportUpdateSchema } from "./reports.validation.js";

const router = Router();

// Member reads — VIP gate enforced in the service.
router.get("/", requireAuth, reportsController.list);
router.get("/admin", requireAuth, requireAdmin, reportsController.adminList);
router.get("/admin/:id", requireAuth, requireAdmin, reportsController.adminGet);
router.get("/:slug", requireAuth, reportsController.getBySlug);

router.post(
  "/",
  requireAuth,
  requireAdmin,
  adminRateLimit({ action: "reports:create" }),
  validate({ body: reportCreateSchema }),
  reportsController.create,
);

router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  adminRateLimit({ action: "reports:update" }),
  validate({ body: reportUpdateSchema }),
  reportsController.update,
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  adminRateLimit({ action: "reports:delete" }),
  reportsController.delete,
);

export { router as reportsRoutes };
