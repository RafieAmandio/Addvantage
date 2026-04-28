import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { subscriptionService } from "./subscription.service.js";

export const subscriptionController = {
  handleWebhook: asyncHandler(async (req, res: Response) => {
    const result = await subscriptionService.handleWebhook(req);
    sendSuccess(res, result);
  }),
};
