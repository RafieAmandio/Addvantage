import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { ValidationError } from "@/core/errors/index.js";
import type { AuthRequest } from "@/core/types/request.js";
import { timelineService } from "./timeline.service.js";
import { timelineQuerySchema, createPinSchema } from "./timeline.validation.js";

export const timelineController = {
  list: asyncHandler(async (req, res: Response) => {
    const parsed = timelineQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      throw new ValidationError(messages);
    }
    const events = await timelineService.list(parsed.data);
    sendSuccess(res, events);
  }),

  getById: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    const event = await timelineService.getById(id);
    sendSuccess(res, event);
  }),

  createPin: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const parsed = createPinSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      throw new ValidationError(messages);
    }
    const result = await timelineService.createPin(authReq.user.id, parsed.data);
    sendSuccess(res, result, "Pin created", 201);
  }),
};
