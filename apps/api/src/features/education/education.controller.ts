import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { educationService } from "./education.service.js";

export const educationController = {
  list: asyncHandler(async (req, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const primers = await educationService.listPublished(limit);
    sendSuccess(res, primers);
  }),

  getByIdOrSlug: asyncHandler(async (req, res: Response) => {
    const idOrSlug = String(req.params.id);
    const primer = await educationService.getByIdOrSlug(idOrSlug);
    sendSuccess(res, primer);
  }),
};
