import type { Response } from "express";
import type { z } from "zod";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { chartService } from "./chart.service.js";
import type { barsQuerySchema } from "./chart.validation.js";

export const chartController = {
  listBars: asyncHandler(async (req, res: Response) => {
    const query = req.query as unknown as z.infer<typeof barsQuerySchema>;
    const result = await chartService.listBars(query);
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    sendSuccess(res, result);
  }),
};
