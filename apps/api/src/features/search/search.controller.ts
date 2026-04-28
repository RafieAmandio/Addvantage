import type { Request, Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { searchRepository } from "./search.repository.js";
import { searchQuerySchema } from "./search.validation.js";
import { ValidationError } from "@/core/errors/index.js";

export const searchController = {
  search: asyncHandler(async (req: Request, res: Response) => {
    const parsed = searchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      throw new ValidationError(messages);
    }
    const { q, limit } = parsed.data;
    const results = await searchRepository.searchApprovedNews(q, limit);
    sendSuccess(res, results);
  }),
};
