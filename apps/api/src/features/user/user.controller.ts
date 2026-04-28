import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { ValidationError } from "@/core/errors/index.js";
import type { AuthRequest } from "@/core/types/request.js";
import { userService } from "./user.service.js";
import { updateProfileSchema } from "./user.validation.js";

export const userController = {
  getMe: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const profile = await userService.getMe(authReq.user.id);
    sendSuccess(res, profile);
  }),

  updateProfile: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      throw new ValidationError(messages);
    }
    await userService.updateProfile(authReq.user.id, parsed.data);
    sendSuccess(res, null, "Profile updated");
  }),
};
