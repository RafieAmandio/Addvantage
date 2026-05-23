import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { requireAdmin } from "@/core/middleware/admin.middleware.js";
import { userRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { validate } from "@/core/middleware/validate.middleware.js";
import { upload } from "@/core/middleware/upload.middleware.js";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { consultController } from "./consult.controller.js";
import {
  createSessionSchema,
  renameSessionSchema,
  appendMessageSchema,
  adminAppendMessageSchema,
} from "./consult.validation.js";

const router = Router();

const auth = [requireAuth] as const;
const admin = [requireAuth, asyncHandler(requireAdmin)] as const;

// ── Subscriber endpoints ──
router.get("/sessions", ...auth, userRateLimit({ limit: 30, action: "consult:list" }), consultController.listSessions);
router.post("/sessions", ...auth, userRateLimit({ limit: 20, action: "consult:create" }), validate({ body: createSessionSchema }), consultController.createSession);
router.put("/sessions/:id", ...auth, userRateLimit({ limit: 30, action: "consult:rename" }), validate({ body: renameSessionSchema }), consultController.renameSession);
router.delete("/sessions/:id", ...auth, userRateLimit({ limit: 30, action: "consult:delete" }), consultController.deleteSession);

router.get("/sessions/:id/messages", ...auth, userRateLimit({ limit: 30, action: "consult:messages" }), consultController.listMessages);
router.post("/sessions/:id/messages", ...auth, userRateLimit({ limit: 30, action: "consult:append" }), validate({ body: appendMessageSchema }), consultController.appendMessage);
router.post("/sessions/:id/upload", ...auth, userRateLimit({ limit: 10, action: "consult:upload" }), upload.single("image"), consultController.uploadImage);

router.get("/sessions/:id/poll", ...auth, consultController.pollSession);

// ── Admin endpoints ──
router.get("/admin/sessions", ...admin, consultController.adminListSessions);
router.get("/admin/sessions/:id/messages", ...admin, consultController.adminListMessages);
router.post("/admin/sessions/:id/messages", ...admin, validate({ body: adminAppendMessageSchema }), consultController.adminSendMessage);
router.put("/admin/sessions/:id/close", ...admin, consultController.adminCloseSession);
router.get("/admin/stats", ...admin, consultController.adminGetStats);

export { router as consultRoutes };
