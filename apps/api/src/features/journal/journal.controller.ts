import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import type { AuthRequest } from "@/core/types/request.js";
import { journalService } from "./journal.service.js";

const uid = (req: unknown) => (req as AuthRequest).user.id;

export const journalController = {
  listTrades: asyncHandler(async (req, res: Response) => sendSuccess(res, await journalService.listTrades(uid(req)))),
  createTrade: asyncHandler(async (req, res: Response) => sendSuccess(res, await journalService.createTrade(uid(req), req.body), "Trade saved", 201)),
  updateTrade: asyncHandler(async (req, res: Response) => sendSuccess(res, await journalService.updateTrade(uid(req), String(req.params.id), req.body), "Trade updated")),
  deleteTrade: asyncHandler(async (req, res: Response) => {
    await journalService.deleteTrade(uid(req), String(req.params.id));
    sendSuccess(res, null, "Trade deleted");
  }),
  getSettings: asyncHandler(async (req, res: Response) => sendSuccess(res, await journalService.getSettings(uid(req)))),
  saveSettings: asyncHandler(async (req, res: Response) => sendSuccess(res, await journalService.saveSettings(uid(req), req.body), "Settings saved")),
  getPlan: asyncHandler(async (req, res: Response) => sendSuccess(res, await journalService.getPlan(uid(req), String(req.query.date)))),
  savePlan: asyncHandler(async (req, res: Response) => sendSuccess(res, await journalService.savePlan(uid(req), req.body.date, req.body.picks), "Plan saved")),
};
