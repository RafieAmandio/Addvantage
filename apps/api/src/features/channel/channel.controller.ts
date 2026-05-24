import type { Request, Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { handleImageUpload } from "@/core/utils/upload-handler.js";
import { channelService } from "./channel.service.js";

export const channelController = {
  // ─── threads ─────────────────────────────────────────────────────────

  listThreads: asyncHandler(async (_req, res: Response) => {
    const threads = await channelService.listThreads();
    sendSuccess(res, threads);
  }),

  createThread: asyncHandler(async (req: Request, res: Response) => {
    const thread = await channelService.createThread(req.body);
    sendSuccess(res, thread, "Thread created", 201);
  }),

  updateThread: asyncHandler(async (req: Request, res: Response) => {
    const thread = await channelService.updateThread(req.params.id as string, req.body);
    sendSuccess(res, thread);
  }),

  deleteThread: asyncHandler(async (req: Request, res: Response) => {
    await channelService.deleteThread(req.params.id as string);
    sendSuccess(res, null, "Thread deleted");
  }),

  // ─── posts ───────────────────────────────────────────────────────────

  listPublished: asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    const threadId = req.query.threadId as string | undefined;
    const result = await channelService.listPublished({ limit, offset, threadId });
    sendSuccess(res, result.content);
  }),

  listAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    const threadId = req.query.threadId as string | undefined;
    const result = await channelService.listAll({ limit, offset, threadId });
    sendSuccess(res, result.content);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const post = await channelService.getById(req.params.id as string);
    sendSuccess(res, post);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { body, author, imageUrl, tags, pinned, published, threadId } = req.body;
    const post = await channelService.create({
      body,
      author,
      imageUrl,
      tags: tags ?? [],
      pinned: pinned ?? false,
      published: published ?? true,
      threadId: threadId ?? null,
    });
    sendSuccess(res, post, "Post created", 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { body, author, imageUrl, tags, pinned, published, threadId } = req.body;
    const post = await channelService.update(req.params.id as string, {
      body,
      author,
      imageUrl,
      tags,
      pinned,
      published,
      threadId,
    });
    sendSuccess(res, post);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await channelService.delete(req.params.id as string);
    sendSuccess(res, null, "Post deleted");
  }),

  uploadImage: asyncHandler(handleImageUpload("channel")),
};
