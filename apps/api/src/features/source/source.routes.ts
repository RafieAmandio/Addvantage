import { Router } from "express";
import { sourceController } from "./source.controller.js";

const router = Router();

router.get("/", sourceController.list);

export { router as sourceRoutes };
