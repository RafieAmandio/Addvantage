import type { Request, Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { graphService } from "./graph.service.js";

export const graphController = {
  getGraph: asyncHandler(async (req: Request, res: Response) => {
    const result = await graphService.getGraph(req.query as Record<string, string>);
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    sendSuccess(res, result);
  }),
};
