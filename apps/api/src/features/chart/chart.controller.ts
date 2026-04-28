import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { ValidationError } from "@/core/errors/index.js";
import { chartService } from "./chart.service.js";
import { barsQuerySchema } from "./chart.validation.js";

export const chartController = {
  listBars: asyncHandler(async (req, res: Response) => {
    const parsed = barsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      throw new ValidationError(messages);
    }
    const result = await chartService.listBars(parsed.data);
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    sendSuccess(res, result);
  }),
};
