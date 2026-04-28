import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { NotFoundError } from "@/core/errors/index.js";
import type { AuthRequest } from "@/core/types/request.js";
import { subscriptionService } from "./subscription.service.js";
import { subscriptionRepository } from "./subscription.repository.js";

export const subscriptionController = {
  handleWebhook: asyncHandler(async (req, res: Response) => {
    const result = await subscriptionService.handleWebhook(req);
    sendSuccess(res, result);
  }),

  getStatus: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const status = await subscriptionRepository.getSubscriptionStatus(authReq.user.id);
    if (!status) throw new NotFoundError("Profile not found");
    sendSuccess(res, status);
  }),

  getHistory: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const history = await subscriptionRepository.getPaymentHistory(authReq.user.id, limit);
    sendSuccess(res, history);
  }),
};
