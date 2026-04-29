import type { Request, Response } from "express";
import type { z } from "zod";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { searchRepository } from "./search.repository.js";
import type { searchQuerySchema } from "./search.validation.js";

export const searchController = {
  search: asyncHandler(async (req: Request, res: Response) => {
    const { q, limit } = req.query as unknown as z.infer<typeof searchQuerySchema>;
    const results = await searchRepository.searchApprovedNews(q, limit);
    sendSuccess(res, results);
  }),
};
