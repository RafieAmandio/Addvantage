import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { userRateLimit } from "@/core/middleware/rate-limit.middleware.js";
import { validate } from "@/core/middleware/validate.middleware.js";
import { journalController as c } from "./journal.controller.js";
import { createTradeSchema, updateTradeSchema, settingsSchema, planQuerySchema, savePlanSchema } from "./journal.validation.js";

const router = Router();
const read = userRateLimit({ limit: 60, action: "journal:read" });
const write = userRateLimit({ limit: 60, action: "journal:write" });

router.get("/trades", requireAuth, read, c.listTrades);
router.post("/trades", requireAuth, write, validate({ body: createTradeSchema }), c.createTrade);
router.put("/trades/:id", requireAuth, write, validate({ body: updateTradeSchema }), c.updateTrade);
router.delete("/trades/:id", requireAuth, write, c.deleteTrade);

router.get("/settings", requireAuth, read, c.getSettings);
router.put("/settings", requireAuth, write, validate({ body: settingsSchema }), c.saveSettings);

router.get("/plan", requireAuth, read, validate({ query: planQuerySchema }), c.getPlan);
router.put("/plan", requireAuth, write, validate({ body: savePlanSchema }), c.savePlan);

export { router as journalRoutes };
