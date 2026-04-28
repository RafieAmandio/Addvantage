import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { ValidationError, AppError } from "@/core/errors/index.js";
import type { AuthRequest } from "@/core/types/request.js";
import { uploadFile, isS3Configured } from "@/config/s3.js";
import { consultService } from "./consult.service.js";
import {
  createSessionSchema,
  renameSessionSchema,
  appendMessageSchema,
  streamBodySchema,
} from "./consult.validation.js";

export const consultController = {
  listSessions: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const sessions = await consultService.listSessions(authReq.user.id, limit);
    sendSuccess(res, sessions);
  }),

  createSession: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      throw new ValidationError(messages);
    }
    const result = await consultService.createSession(authReq.user.id, parsed.data.title);
    sendSuccess(res, result, "Session created", 201);
  }),

  renameSession: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const sessionId = String(req.params.id);
    const parsed = renameSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      throw new ValidationError(messages);
    }
    await consultService.renameSession(authReq.user.id, sessionId, parsed.data.title);
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
    const parsed = appendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      throw new ValidationError(messages);
    }
    const result = await consultService.appendMessage(authReq.user.id, sessionId, parsed.data);
    sendSuccess(res, result, "Message appended", 201);
  }),

  uploadImage: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const sessionId = String(req.params.id);

    if (!isS3Configured()) {
      throw new AppError("File uploads not configured", 503);
    }

    const file = (req as unknown as { file?: Express.Multer.File }).file;
    if (!file) {
      throw new ValidationError(["No file provided"]);
    }

    const session = await consultService.verifySessionOwnership(authReq.user.id, sessionId);
    if (!session) throw new AppError("Session not found", 404);

    const result = await uploadFile(file.buffer, file.originalname, file.mimetype, "consult");

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

  stream: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const parsed = streamBodySchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      throw new ValidationError(messages);
    }

    const { sessionId, body } = parsed.data;
    const userId = authReq.user.id;

    const tier = await consultService.getUserTier(userId);
    if (tier === "free") {
      const { allowed } = await consultService.checkDailyTokenCap(userId);
      if (!allowed) {
        throw new AppError("Daily token cap reached", 429);
      }
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    await consultService.streamResponse(userId, sessionId, body, (chunk) => {
      res.write(chunk);
    });

    res.end();
  }),
};
