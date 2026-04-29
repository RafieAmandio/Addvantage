import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import type { AuthRequest } from "@/core/types/request.js";
import { userService } from "./user.service.js";

export const userController = {
  getMe: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const profile = await userService.getMe(authReq.user.id);
    sendSuccess(res, profile);
  }),

  updateProfile: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    await userService.updateProfile(authReq.user.id, req.body);
    sendSuccess(res, null, "Profile updated");
  }),
};
