import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { requireAdmin } from "@/core/middleware/admin.middleware.js";
import { adminRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { validate } from "@/core/middleware/validate.middleware.js";
import { shortLinksController } from "./short-links.controller.js";
import { shortLinkUpdateSchema } from "./short-links.validation.js";

const router = Router();

// Admin editor for the meet shortlink. The public redirect is handled by
// meet-redirect.middleware (host-based), not a route here.
router.get("/admin/meet", requireAuth, requireAdmin, shortLinksController.adminGetMeet);

router.put(
  "/admin/meet",
  requireAuth,
  requireAdmin,
  adminRateLimit({ action: "short-links:update" }),
  validate({ body: shortLinkUpdateSchema }),
  shortLinksController.adminUpdateMeet,
);

export { router as shortLinksRoutes };
