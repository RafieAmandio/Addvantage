import type { Response } from "express";
import type { z } from "zod";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { AppError } from "@/core/errors/index.js";
import { atrService } from "./atr.service.js";
import type { atrDetailParamsSchema } from "./atr.validation.js";

export const atrController = {
  getScanner: asyncHandler(async (_req, res: Response) => {
    const result = await atrService.getScanner();
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    sendSuccess(res, result);
  }),

  getDetail: asyncHandler(async (req, res: Response) => {
    const params = req.params as unknown as z.infer<typeof atrDetailParamsSchema>;
    const result = await atrService.getDetail(params.symbol);
    if (!result) throw new AppError("Symbol not found", 404);
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    sendSuccess(res, result);
  }),
};
