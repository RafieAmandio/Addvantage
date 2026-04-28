import { Router } from "express";
import { educationController } from "./education.controller.js";

const router = Router();

router.get("/", educationController.list);
router.get("/:id", educationController.getByIdOrSlug);

export { router as educationRoutes };
