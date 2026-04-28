import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess, sendPaginatedSuccess } from "@/core/utils/response.js";
import { parsePagination } from "@/core/utils/pagination.js";
import { ValidationError } from "@/core/errors/index.js";
import type { AdminRequest } from "@/core/types/request.js";
import { newsService } from "./news.service.js";
import { newsCreateSchema, newsEditSchema } from "./news.validation.js";

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
    const result = await newsService.listPending(opts);
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
    const parsed = newsCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      throw new ValidationError(messages);
    }
    const data = parsed.data;
    const result = await newsService.create({
      headline: data.headline,
      rephrased: data.rephrased,
      analysis: data.analysis,
      impact: data.impact,
      bias: data.bias,
      affects: data.affects,
      tags: data.tags,
      author: data.author,
      sourceCode: data.source_code,
      sourceUrl: data.source_url,
      rawText: data.raw_text,
    });
    sendSuccess(res, result, "News item created", 201);
  }),

  saveDraft: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    const parsed = newsEditSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      throw new ValidationError(messages);
    }
    await newsService.updateDraft(id, parsed.data);
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
