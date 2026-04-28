import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { tierRateLimit, userRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { upload } from "@/core/middleware/upload.middleware.js";
import type { Request } from "express";
import type { AuthUser } from "@/core/types/request.js";
import { consultController } from "./consult.controller.js";

const router = Router();

const auth = [requireAuth] as const;

const getTier = (req: Request) => {
  const user = (req as Request & { user?: AuthUser & { tier?: string } }).user;
  return user?.tier === "vip" ? ("vip" as const) : ("free" as const);
};

router.get("/sessions", ...auth, userRateLimit({ limit: 30, action: "consult:list" }), consultController.listSessions);
router.post("/sessions", ...auth, userRateLimit({ limit: 20, action: "consult:create" }), consultController.createSession);
router.put("/sessions/:id", ...auth, userRateLimit({ limit: 30, action: "consult:rename" }), consultController.renameSession);
router.delete("/sessions/:id", ...auth, userRateLimit({ limit: 30, action: "consult:delete" }), consultController.deleteSession);

router.get("/sessions/:id/messages", ...auth, userRateLimit({ limit: 30, action: "consult:messages" }), consultController.listMessages);
router.post("/sessions/:id/messages", ...auth, userRateLimit({ limit: 30, action: "consult:append" }), consultController.appendMessage);
router.post("/sessions/:id/upload", ...auth, userRateLimit({ limit: 10, action: "consult:upload" }), upload.single("image"), consultController.uploadImage);

router.post("/stream", ...auth, tierRateLimit("consult:send", getTier), consultController.stream);

export { router as consultRoutes };
