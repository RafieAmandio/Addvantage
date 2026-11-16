import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { reportsController } from "./reports.controller.js";

const router = Router();

// Member read, VIP gate enforced in the service. Rows are written by the class
// recap automation straight into class_reports, so there is no admin CRUD here.
router.get("/", requireAuth, reportsController.list);

export { router as reportsRoutes };
