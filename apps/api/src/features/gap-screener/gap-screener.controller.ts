import type { Request, Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { gapScreenerService } from "./gap-screener.service.js";

export const gapScreenerController = {
  getScanner: asyncHandler(async (_req: Request, res: Response) => {
    res.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    const data = await gapScreenerService.getScanner();
    sendSuccess(res, data);
  }),
};
