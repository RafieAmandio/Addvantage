import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess, sendPaginatedSuccess } from "@/core/utils/response.js";
import { parsePagination } from "@/core/utils/pagination.js";
import type { AdminRequest } from "@/core/types/request.js";
import { newsService } from "./news.service.js";

export const newsController = {
  listApproved: asyncHandler(async (req, res: Response) => {
    const opts = parsePagination(req.query);
    const result = await newsService.listApproved(opts);
    sendPaginatedSuccess(res, result);
  }),

  getApproved: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    const item = await newsService.getApproved(id);
    sendSuccess(res, item);
  }),

  listPending: asyncHandler(async (req, res: Response) => {
    const opts = parsePagination(req.query);
    const split = (v: unknown) => v ? String(v).split(",").filter(Boolean) : undefined;
    const sources = split(req.query.source);
    const impacts = split(req.query.impact);
    const biases = split(req.query.bias);
    const tags = split(req.query.tags);
    const status = req.query.status ? String(req.query.status) : undefined;
    const sort = req.query.sort === "asc" ? "asc" as const : "desc" as const;
    const result = await newsService.listFiltered({ ...opts, sources, impacts, biases, tags, status, sort });
    sendPaginatedSuccess(res, result);
  }),

  listRejected: asyncHandler(async (req, res: Response) => {
    const opts = parsePagination(req.query);
    const result = await newsService.listRejected(opts);
    sendPaginatedSuccess(res, result);
  }),

  getForAdmin: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    const item = await newsService.getForAdmin(id);
    sendSuccess(res, item);
  }),

  create: asyncHandler(async (req, res: Response) => {
    const data = req.body;
    const result = await newsService.create({
      headline: data.headline,
      rephrased: data.rephrased,
      analysis: data.analysis,
      impact: data.impact,
      bias: data.bias,
      affects: data.affects,
      tags: data.tags,
      author: data.author,
      sourceCode: data.sourceCode,
      sourceUrl: data.sourceUrl,
      rawText: data.rawText,
    });
    sendSuccess(res, result, "News item created", 201);
  }),

  saveDraft: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    await newsService.updateDraft(id, req.body);
    sendSuccess(res, null, "Draft saved");
  }),

  approve: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    const adminReq = req as AdminRequest;
    await newsService.approve(id, adminReq.user.id);
    sendSuccess(res, null, "Item approved and published");
  }),

  reject: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    const adminReq = req as AdminRequest;
    await newsService.reject(id, adminReq.user.id);
    sendSuccess(res, null, "Item rejected");
  }),
};
