import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { requireAdmin } from "@/core/middleware/admin.middleware.js";
import { adminRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { newsController } from "./news.controller.js";

const router = Router();

router.get("/", newsController.listApproved);
router.get("/admin/pending", requireAuth, requireAdmin, newsController.listPending);
router.get("/admin/rejected", requireAuth, requireAdmin, newsController.listRejected);
router.get("/admin/:id", requireAuth, requireAdmin, newsController.getForAdmin);
router.get("/:id", newsController.getApproved);

router.post(
  "/",
  requireAuth,
  requireAdmin,
  adminRateLimit({ action: "news:create" }),
  newsController.create,
);

router.put(
  "/:id/draft",
  requireAuth,
  requireAdmin,
  adminRateLimit({ action: "news:draft" }),
  newsController.saveDraft,
);

router.put(
  "/:id/approve",
  requireAuth,
  requireAdmin,
  adminRateLimit({ action: "news:approve" }),
  newsController.approve,
);

router.put(
  "/:id/reject",
  requireAuth,
  requireAdmin,
  adminRateLimit({ action: "news:reject" }),
  newsController.reject,
);

export { router as newsRoutes };
