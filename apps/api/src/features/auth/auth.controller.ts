import type { Request, Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { AppError } from "@/core/errors/index.js";
import type { AuthRequest } from "@/core/types/request.js";
import { logger } from "@/config/logger.js";
import { authService } from "./auth.service.js";
import type { RegisterInput, LoginInput } from "./auth.validation.js";

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as RegisterInput;
    const result = await authService.register(input);
    sendSuccess(res, result, "Registered", 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as LoginInput;
    const result = await authService.login(input);
    sendSuccess(res, result, "Logged in");
  }),

  refresh: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const result = await authService.refresh(authReq.user.id);
    sendSuccess(res, result, "Token refreshed");
  }),

  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    const token = req.query.token as string;
    const result = await authService.verifyEmail(token);
    sendSuccess(res, result, "Email verified");
  }),

  resendVerification: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const result = await authService.resendVerification(authReq.user.id);
    sendSuccess(res, result, "Verification email sent");
  }),

  serviceToken: asyncHandler(async (req: Request, res: Response) => {
    const secret = req.headers["x-service-secret"] as string;
    if (!secret) throw new AppError("Missing X-Service-Secret header", 401);
    const result = await authService.serviceToken(secret);
    sendSuccess(res, result, "Service token issued");
  }),

  logout: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    logger.info({ userId: authReq.user.id, scope: "auth.logout" }, "user logged out");
    sendSuccess(res, null, "Logged out");
  }),
};
