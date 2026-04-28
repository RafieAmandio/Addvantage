import { Router } from "express";
import { tagController } from "./tag.controller.js";

const router = Router();

router.get("/counts", tagController.counts);
router.get("/:tag/news", tagController.newsByTag);

export { router as tagRoutes };
