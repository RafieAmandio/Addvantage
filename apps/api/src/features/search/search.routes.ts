import { Router } from "express";
import { ipRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { searchController } from "./search.controller.js";

const router = Router();

router.get("/", ipRateLimit({ limit: 30, windowSec: 60, action: "search" }), searchController.search);

export { router as searchRoutes };
