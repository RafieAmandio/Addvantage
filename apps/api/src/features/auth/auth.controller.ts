import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import type { AuthRequest } from "@/core/types/request.js";
import { logger } from "@/config/logger.js";

export const authController = {
  logout: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    logger.info({ userId: authReq.user.id, scope: "auth.logout" }, "user logged out");
    sendSuccess(res, null, "Logged out");
  }),
};
