import type { Request, Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { shortLinksService } from "./short-links.service.js";

const MEET_SLUG = "meet";

export const shortLinksController = {
  adminGetMeet: asyncHandler(async (_req, res: Response) => {
    sendSuccess(res, await shortLinksService.get(MEET_SLUG));
  }),

  adminUpdateMeet: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await shortLinksService.update(MEET_SLUG, req.body));
  }),
};
