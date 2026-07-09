import type { Request, Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import type { AuthUser } from "@/core/types/request.js";
import { upgradeRadarService } from "./upgrade-radar.service.js";

export const upgradeRadarController = {
  getUpcoming: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: AuthUser }).user;
    const data = await upgradeRadarService.getUpcoming(user.id);
    sendSuccess(res, data);
  }),
};
