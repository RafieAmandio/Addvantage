import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { macroRepository } from "./macro.repository.js";

export const macroController = {
  getLatest: asyncHandler(async (_req, res: Response) => {
    const row = await macroRepository.latest();
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1800");
    sendSuccess(res, row ? { ...(row.data as object), syncedAt: row.syncedAt } : { banks: {}, risk: {}, syncedAt: null });
  }),
};
