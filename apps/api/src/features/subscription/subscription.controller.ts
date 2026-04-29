import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import type { AuthRequest } from "@/core/types/request.js";
import { subscriptionService } from "./subscription.service.js";

export const subscriptionController = {
  handleWebhook: asyncHandler(async (req, res: Response) => {
    const result = await subscriptionService.handleWebhook(req);
    sendSuccess(res, result);
  }),

  getStatus: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const status = await subscriptionService.getStatus(authReq.user.id);
    sendSuccess(res, status);
  }),

  getHistory: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const history = await subscriptionService.getHistory(authReq.user.id, limit);
    sendSuccess(res, history);
  }),
};
