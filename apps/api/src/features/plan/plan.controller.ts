import type { Response } from "express";
import type { Prisma } from "@tradevantage/db";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess, sendPaginatedSuccess } from "@/core/utils/response.js";
import { parsePagination } from "@/core/utils/pagination.js";
import { ValidationError } from "@/core/errors/index.js";
import type { AdminRequest, MulterRequest } from "@/core/types/request.js";
import { planService } from "./plan.service.js";

export const planController = {
  listPublished: asyncHandler(async (req, res: Response) => {
    const opts = parsePagination(req.query);
    const symbol = req.query.symbol ? String(req.query.symbol) : undefined;
    const result = await planService.listPublished({ ...opts, symbol });
    sendPaginatedSuccess(res, result);
  }),

  getPublished: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    const plan = await planService.getPublished(id);
    sendSuccess(res, plan);
  }),

  getNewsForPlan: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    const news = await planService.getNewsForPlan(id);
    sendSuccess(res, news);
  }),

  getStats: asyncHandler(async (_req, res: Response) => {
    const stats = await planService.getStats();
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    sendSuccess(res, stats);
  }),

  listAllForAdmin: asyncHandler(async (req, res: Response) => {
    const opts = parsePagination(req.query);
    const result = await planService.listAllForAdmin(opts);
    sendPaginatedSuccess(res, result);
  }),

  listMyDrafts: asyncHandler(async (req, res: Response) => {
    const adminReq = req as AdminRequest;
    const opts = parsePagination(req.query);
    const result = await planService.listMyDrafts(adminReq.user.id, opts);
    sendPaginatedSuccess(res, result);
  }),

  getForAdmin: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    const plan = await planService.getForAdmin(id);
    sendSuccess(res, plan);
  }),

  create: asyncHandler(async (req, res: Response) => {
    const adminReq = req as AdminRequest;
    const data = req.body;
    const result = await planService.create({
      symbol: data.symbol,
      thesis: data.thesis,
      direction: data.direction,
      bias: data.bias,
      entry: data.entry,
      stop: data.stop,
      target: data.target,
      rMultiple: data.rMultiple,
      setups: data.setups as Prisma.InputJsonValue,
      tags: data.tags,
      risks: data.risks,
      tier: data.tier,
      authorId: adminReq.user.id,
    });
    sendSuccess(res, result, "Plan created", 201);
  }),

  update: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    const data = req.body;
    const updateData: Record<string, unknown> = {};
    if (data.symbol !== undefined) updateData.symbol = data.symbol;
    if (data.thesis !== undefined) updateData.thesis = data.thesis;
    if (data.direction !== undefined) updateData.direction = data.direction;
    if (data.bias !== undefined) updateData.bias = data.bias;
    if (data.entry !== undefined) updateData.entry = data.entry;
    if (data.stop !== undefined) updateData.stop = data.stop;
    if (data.target !== undefined) updateData.target = data.target;
    if (data.rMultiple !== undefined) updateData.rMultiple = data.rMultiple;
    if (data.setups !== undefined) updateData.setups = data.setups;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.risks !== undefined) updateData.risks = data.risks;
    if (data.tier !== undefined) updateData.tier = data.tier;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

    await planService.update(id, updateData);
    sendSuccess(res, null, "Plan updated");
  }),

  publish: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    await planService.publish(id);
    sendSuccess(res, null, "Plan published");
  }),

  close: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    await planService.close(id, {
      outcome: req.body.outcome,
      closePrice: req.body.closePrice,
    });
    sendSuccess(res, null, "Plan closed");
  }),

  remove: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    await planService.remove(id);
    sendSuccess(res, null, "Plan deleted");
  }),

  uploadSetupImage: asyncHandler(async (req, res: Response) => {
    const file = (req as MulterRequest).file;
    if (!file) throw new ValidationError(["No file provided"]);

    const result = await planService.uploadSetupImage(file);
    sendSuccess(res, result, "Image uploaded", 201);
  }),

  uploadImage: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    const file = (req as MulterRequest).file;
    if (!file) throw new ValidationError(["No file provided"]);

    const result = await planService.uploadImage(id, file);
    sendSuccess(res, result, "Image uploaded", 201);
  }),

  removeImage: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    await planService.removeImage(id);
    sendSuccess(res, null, "Image removed");
  }),
};
