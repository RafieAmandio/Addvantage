import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { channelService } from "./channel.service.js";

export const channelController = {
  listPublished: asyncHandler(async (req, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    const result = await channelService.listPublished({ limit, offset });
    sendSuccess(res, result.content);
  }),

  listAll: asyncHandler(async (req, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    const result = await channelService.listAll({ limit, offset });
    sendSuccess(res, result.content);
  }),

  getById: asyncHandler(async (req, res: Response) => {
    const post = await channelService.getById(req.params.id);
    sendSuccess(res, post);
  }),

  create: asyncHandler(async (req, res: Response) => {
    const { body, author, image_url, tags, pinned, published } = req.body;
    const post = await channelService.create({
      body,
      author,
      imageUrl: image_url,
      tags: tags ?? [],
      pinned: pinned ?? false,
      published: published ?? true,
    });
    sendSuccess(res, post, "Post created", 201);
  }),

  update: asyncHandler(async (req, res: Response) => {
    const { body, author, image_url, tags, pinned, published } = req.body;
    const post = await channelService.update(req.params.id, {
      body,
      author,
      imageUrl: image_url,
      tags,
      pinned,
      published,
    });
    sendSuccess(res, post);
  }),

  delete: asyncHandler(async (req, res: Response) => {
    await channelService.delete(req.params.id);
    sendSuccess(res, null, "Post deleted");
  }),
};
