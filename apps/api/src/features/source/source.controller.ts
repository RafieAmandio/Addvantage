import type { Request, Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { sourceRepository } from "./source.repository.js";

export const sourceController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const sources = await sourceRepository.findAll();
    sendSuccess(res, sources);
  }),
};
