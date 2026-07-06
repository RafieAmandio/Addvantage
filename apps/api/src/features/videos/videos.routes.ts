import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { requireAdmin } from "@/core/middleware/admin.middleware.js";
import { adminRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { validate } from "@/core/middleware/validate.middleware.js";
import { videosController } from "./videos.controller.js";
import { videoCreateSchema, videoUpdateSchema } from "./videos.validation.js";

const router = Router();

// Member reads — VIP gate enforced in the service.
router.get("/", requireAuth, videosController.list);
router.get("/admin", requireAuth, requireAdmin, videosController.adminList);
router.get("/admin/:id", requireAuth, requireAdmin, videosController.adminGet);
router.get("/:slug", requireAuth, videosController.getBySlug);

router.post(
  "/",
  requireAuth,
  requireAdmin,
  adminRateLimit({ action: "videos:create" }),
  validate({ body: videoCreateSchema }),
  videosController.create,
);

router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  adminRateLimit({ action: "videos:update" }),
  validate({ body: videoUpdateSchema }),
  videosController.update,
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  adminRateLimit({ action: "videos:delete" }),
  videosController.delete,
);

export { router as videosRoutes };
