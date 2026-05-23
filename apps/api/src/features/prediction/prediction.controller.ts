import type { Response } from "express";
import type { z } from "zod";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { predictionService } from "./prediction.service.js";
import type { historyQuerySchema } from "./prediction.validation.js";

export const predictionController = {
  getHistory: asyncHandler(async (req, res: Response) => {
    const query = req.query as unknown as z.infer<typeof historyQuerySchema>;
    const result = await predictionService.getHistory(query);
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    sendSuccess(res, result);
  }),
};
