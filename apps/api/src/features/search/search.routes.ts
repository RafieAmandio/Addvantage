import { Router } from "express";
import { ipRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { validate } from "@/core/middleware/validate.middleware.js";
import { searchController } from "./search.controller.js";
import { searchQuerySchema } from "./search.validation.js";

const router = Router();

router.get("/", ipRateLimit({ limit: 30, windowSec: 60, action: "search" }), validate({ query: searchQuerySchema }), searchController.search);

export { router as searchRoutes };
