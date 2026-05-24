import { Router } from "express";
import { validate } from "@/core/middleware/validate.middleware.js";
import { ipRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { graphQuerySchema } from "./graph.validation.js";
import { graphController } from "./graph.controller.js";

const router = Router();

router.get(
  "/",
  ipRateLimit({ limit: 30, windowSec: 60, action: "graph" }),
  validate({ query: graphQuerySchema }),
  graphController.getGraph,
);

export { router as graphRoutes };
