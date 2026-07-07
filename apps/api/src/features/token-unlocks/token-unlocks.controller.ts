import type { Request, Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import type { AuthUser } from "@/core/types/request.js";
import { tokenUnlocksService } from "./token-unlocks.service.js";

export const tokenUnlocksController = {
  getUpcoming: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: AuthUser }).user;
    const data = await tokenUnlocksService.getUpcoming(user.id);
    sendSuccess(res, data);
  }),
};
