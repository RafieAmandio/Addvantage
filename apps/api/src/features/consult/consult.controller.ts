import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { ValidationError, AppError } from "@/core/errors/index.js";
import type { AuthRequest } from "@/core/types/request.js";
import { getStorageProvider } from "@/integrations/storage/index.js";
import { consultService } from "./consult.service.js";

export const consultController = {
  listSessions: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const sessions = await consultService.listSessions(authReq.user.id, limit);
    sendSuccess(res, sessions);
  }),

  createSession: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const result = await consultService.createSession(authReq.user.id, req.body.title);
    sendSuccess(res, result, "Session created", 201);
  }),

  renameSession: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const sessionId = String(req.params.id);
    await consultService.renameSession(authReq.user.id, sessionId, req.body.title);
    sendSuccess(res, null, "Session renamed");
  }),

  deleteSession: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const sessionId = String(req.params.id);
    await consultService.deleteSession(authReq.user.id, sessionId);
    sendSuccess(res, null, "Session deleted");
  }),

  listMessages: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const sessionId = String(req.params.id);
    const limit = req.query.limit ? Number(req.query.limit) : 200;
    const messages = await consultService.listMessages(authReq.user.id, sessionId, limit);
    sendSuccess(res, messages);
  }),

  appendMessage: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const sessionId = String(req.params.id);
    const result = await consultService.appendMessage(authReq.user.id, sessionId, req.body, authReq.user.email);
    sendSuccess(res, result, "Message appended", 201);
  }),

  uploadImage: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const sessionId = String(req.params.id);

    const storage = getStorageProvider();
    if (!storage) {
      throw new AppError("File uploads not configured", 503);
    }

    const file = (req as unknown as { file?: Express.Multer.File }).file;
    if (!file) {
      throw new ValidationError(["No file provided"]);
    }

    const session = await consultService.verifySessionOwnership(authReq.user.id, sessionId);
    if (!session) throw new AppError("Session not found", 404);

    const result = await storage.upload({
      buffer: file.buffer,
      originalName: file.originalname,
      contentType: file.mimetype,
      folder: "consult",
    });

    const message = await consultService.appendMessage(authReq.user.id, sessionId, {
      role: "user",
      content: `[image: ${file.originalname}]`,
      metadata: {
        type: "image",
        imageUrl: result.url,
        imageKey: result.key,
        contentType: result.contentType,
        size: result.size,
        originalName: file.originalname,
      },
    });

    sendSuccess(res, { ...message, imageUrl: result.url }, "Image uploaded", 201);
  }),

  pollSession: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const sessionId = String(req.params.id);
    const after = req.query.after ? String(req.query.after) : undefined;
    const result = await consultService.pollSession(authReq.user.id, sessionId, after);
    sendSuccess(res, result);
  }),

  // ── Admin handlers ──

  adminListSessions: asyncHandler(async (_req, res: Response) => {
    const status = _req.query.status ? String(_req.query.status) : undefined;
    const sessions = await consultService.adminListSessions(status ? { status } : undefined);
    sendSuccess(res, sessions);
  }),

  adminListMessages: asyncHandler(async (req, res: Response) => {
    const sessionId = String(req.params.id);
    const messages = await consultService.adminListMessages(sessionId);
    sendSuccess(res, messages);
  }),

  adminSendMessage: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const sessionId = String(req.params.id);
    const result = await consultService.adminSendMessage(authReq.user.id, sessionId, req.body.content);
    sendSuccess(res, result, "Message sent", 201);
  }),

  adminCloseSession: asyncHandler(async (req, res: Response) => {
    const sessionId = String(req.params.id);
    await consultService.adminCloseSession(sessionId);
    sendSuccess(res, null, "Session closed");
  }),

  adminGetStats: asyncHandler(async (_req, res: Response) => {
    const stats = await consultService.getSessionStats();
    sendSuccess(res, stats);
  }),
};
