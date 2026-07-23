import type { Request, Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import type { AuthUser } from "@/core/types/request.js";
import { reportsService } from "./reports.service.js";

function userId(req: Request): string {
  return (req as Request & { user: AuthUser }).user.id;
}

export const reportsController = {
  list: asyncHandler(async (req, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const reports = await reportsService.listPublished(userId(req), limit);
    sendSuccess(res, reports);
  }),

  getBySlug: asyncHandler(async (req, res: Response) => {
    const report = await reportsService.getBySlug(userId(req), String(req.params.slug));
    sendSuccess(res, report);
  }),

  adminList: asyncHandler(async (_req, res: Response) => {
    sendSuccess(res, await reportsService.listAll());
  }),

  adminGet: asyncHandler(async (req, res: Response) => {
    sendSuccess(res, await reportsService.getById(String(req.params.id)));
  }),

  create: asyncHandler(async (req, res: Response) => {
    sendSuccess(res, await reportsService.create(req.body));
  }),

  update: asyncHandler(async (req, res: Response) => {
    sendSuccess(res, await reportsService.update(String(req.params.id), req.body));
  }),

  delete: asyncHandler(async (req, res: Response) => {
    await reportsService.delete(String(req.params.id));
    sendSuccess(res, { deleted: true });
  }),
};
