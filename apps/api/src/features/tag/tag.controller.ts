import type { Request, Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { tagService } from "./tag.service.js";

export const tagController = {
  counts: asyncHandler(async (_req: Request, res: Response) => {
    const counts = await tagService.getCounts();
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    sendSuccess(res, counts);
  }),

  newsByTag: asyncHandler(async (req: Request, res: Response) => {
    const tag = String(req.params.tag);
    const limit = Math.min(Number(String(req.query.limit ?? "")) || 50, 200);
    const items = await tagService.listNewsByTag(tag, limit);
    sendSuccess(res, items);
  }),
};
