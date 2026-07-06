import type { Request, Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import type { AuthUser } from "@/core/types/request.js";
import { videosService } from "./videos.service.js";

function userId(req: Request): string {
  return (req as Request & { user: AuthUser }).user.id;
}

export const videosController = {
  list: asyncHandler(async (req, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const videos = await videosService.listPublished(userId(req), limit);
    sendSuccess(res, videos);
  }),

  getBySlug: asyncHandler(async (req, res: Response) => {
    const video = await videosService.getBySlug(userId(req), String(req.params.slug));
    sendSuccess(res, video);
  }),

  adminList: asyncHandler(async (_req, res: Response) => {
    sendSuccess(res, await videosService.listAll());
  }),

  adminGet: asyncHandler(async (req, res: Response) => {
    sendSuccess(res, await videosService.getById(String(req.params.id)));
  }),

  create: asyncHandler(async (req, res: Response) => {
    sendSuccess(res, await videosService.create(req.body));
  }),

  update: asyncHandler(async (req, res: Response) => {
    sendSuccess(res, await videosService.update(String(req.params.id), req.body));
  }),

  delete: asyncHandler(async (req, res: Response) => {
    await videosService.delete(String(req.params.id));
    sendSuccess(res, { deleted: true });
  }),
};
