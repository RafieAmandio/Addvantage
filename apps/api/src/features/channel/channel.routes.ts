import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { requireAdmin } from "@/core/middleware/admin.middleware.js";
import { upload } from "@/core/middleware/upload.middleware.js";
import { channelController } from "./channel.controller.js";

const router = Router();

router.get("/", channelController.listPublished);
router.get("/admin/all", requireAuth, requireAdmin, channelController.listAll);
router.get("/:id", channelController.getById);
router.post("/upload", requireAuth, requireAdmin, upload.single("image"), channelController.uploadImage);
router.post("/", requireAuth, requireAdmin, channelController.create);
router.put("/:id", requireAuth, requireAdmin, channelController.update);
router.delete("/:id", requireAuth, requireAdmin, channelController.delete);

export { router as channelRoutes };
