import { Router } from "express";
import { validate } from "@/core/middleware/validate.middleware.js";
import { predictionController } from "./prediction.controller.js";
import { historyQuerySchema } from "./prediction.validation.js";

const router = Router();

router.get(
  "/history",
  validate({ query: historyQuerySchema }),
  predictionController.getHistory,
);

export { router as predictionRoutes };
