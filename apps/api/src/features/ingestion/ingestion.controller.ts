import type { Request, Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { ingestionRepository } from "./ingestion.repository.js";

export const ingestionController = {
  listRuns: asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const [runs, sources] = await Promise.all([
      ingestionRepository.listRuns(limit),
      ingestionRepository.listSources(),
    ]);
    sendSuccess(res, { runs, sources });
  }),
};
