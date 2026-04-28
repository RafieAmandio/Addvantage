import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { ValidationError } from "@/core/errors/index.js";
import { calendarService } from "./calendar.service.js";
import { eventsQuerySchema } from "./calendar.validation.js";

export const calendarController = {
  listEvents: asyncHandler(async (req, res: Response) => {
    const symbolsRaw = [
      ...(Array.isArray(req.query.symbols) ? req.query.symbols.map(String) : [String(req.query.symbols ?? "")]),
      ...(Array.isArray(req.query["symbols[]"]) ? req.query["symbols[]"].map(String) : req.query["symbols[]"] ? [String(req.query["symbols[]"])] : []),
    ].join(",");

    const parsed = eventsQuerySchema.safeParse({
      symbols: symbolsRaw,
      from: req.query.from,
      to: req.query.to,
      limit: req.query.limit,
    });
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      throw new ValidationError(messages);
    }

    const result = await calendarService.listEvents({
      symbols: parsed.data.symbols,
      from: parsed.data.from,
      to: parsed.data.to,
      limit: parsed.data.limit,
    });
    res.setHeader("Cache-Control", "private, max-age=60, stale-while-revalidate=300");
    sendSuccess(res, result);
  }),

  getCorrelation: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    const news = await calendarService.getCorrelatedNews(id);
    sendSuccess(res, news);
  }),
};
