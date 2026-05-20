import type { Response } from "express";
import type { z } from "zod";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { rsiService } from "./rsi.service.js";
import type { rsiHeatmapQuerySchema, rsiDetailParamsSchema } from "./rsi.validation.js";

export const rsiController = {
  getHeatmap: asyncHandler(async (req, res: Response) => {
    const query = req.query as unknown as z.infer<typeof rsiHeatmapQuerySchema>;
    const result = await rsiService.getHeatmap(query.interval);
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    sendSuccess(res, result);
  }),

  getDetail: asyncHandler(async (req, res: Response) => {
    const params = req.params as unknown as z.infer<typeof rsiDetailParamsSchema>;
    const result = await rsiService.getDetail(params.symbol);
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    sendSuccess(res, result);
  }),
};
