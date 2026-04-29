import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import type { AuthRequest } from "@/core/types/request.js";
import { timelineService } from "./timeline.service.js";

export const timelineController = {
  list: asyncHandler(async (req, res: Response) => {
    const events = await timelineService.list(req.query);
    sendSuccess(res, events);
  }),

  getById: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    const event = await timelineService.getById(id);
    sendSuccess(res, event);
  }),

  createPin: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const result = await timelineService.createPin(authReq.user.id, req.body);
    sendSuccess(res, result, "Pin created", 201);
  }),
};
