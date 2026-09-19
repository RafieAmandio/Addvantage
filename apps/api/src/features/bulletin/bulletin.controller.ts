import type { Request, Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import type { AuthRequest } from "@/core/types/request.js";
import { bulletinService } from "./bulletin.service.js";

export const bulletinController = {
  // ─── read (VIP / admin members) ──────────────────────────────────────
  list: asyncHandler(async (req: Request, res: Response) => {
    const bulletins = await bulletinService.list((req as AuthRequest).user.id);
    sendSuccess(res, bulletins);
  }),

  getForAdmin: asyncHandler(async (req: Request, res: Response) => {
    const bulletin = await bulletinService.getById(req.params.id as string);
    sendSuccess(res, bulletin);
  }),

  // ─── write (admin) ───────────────────────────────────────────────────
  create: asyncHandler(async (req: Request, res: Response) => {
    const bulletin = await bulletinService.create(req.body);
    sendSuccess(res, bulletin, "Bulletin created", 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const bulletin = await bulletinService.update(req.params.id as string, req.body);
    sendSuccess(res, bulletin);
  }),

  upsertLevel: asyncHandler(async (req: Request, res: Response) => {
    const bulletin = await bulletinService.upsertLevel(req.params.id as string, req.body);
    sendSuccess(res, bulletin);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await bulletinService.delete(req.params.id as string);
    sendSuccess(res, null, "Bulletin deleted");
  }),

  // ─── ingest (Jeff / trusted server-side callers) ─────────────────────
  ingest: asyncHandler(async (req: Request, res: Response) => {
    const bulletin = await bulletinService.ingest(req.body);
    sendSuccess(res, bulletin, "Bulletin ingested");
  }),
};
