import type { Request, Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import type { AuthUser } from "@/core/types/request.js";
import { reportsService } from "./reports.service.js";

export const reportsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as Request & { user: AuthUser }).user.id;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    sendSuccess(res, await reportsService.listPublished(userId, limit));
  }),
};
