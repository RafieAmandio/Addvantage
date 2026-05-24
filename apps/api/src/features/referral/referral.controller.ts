import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { AppError, ValidationError } from "@/core/errors/index.js";
import { getStorageProvider } from "@/integrations/storage/index.js";
import type { MulterRequest } from "@/core/types/request.js";
import { referralRepository } from "./referral.repository.js";

export const referralController = {
  list: asyncHandler(async (_req, res: Response) => {
    const partners = await referralRepository.listActive();
    sendSuccess(res, partners);
  }),

  adminList: asyncHandler(async (_req, res: Response) => {
    const partners = await referralRepository.listAll();
    sendSuccess(res, partners);
  }),

  adminCreate: asyncHandler(async (req, res: Response) => {
    const partner = await referralRepository.create(req.body);
    sendSuccess(res, partner, "Partner created", 201);
  }),

  adminUpdate: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    const partner = await referralRepository.update(id, req.body);
    sendSuccess(res, partner, "Partner updated");
  }),

  adminDelete: asyncHandler(async (req, res: Response) => {
    const id = String(req.params.id);
    await referralRepository.remove(id);
    sendSuccess(res, null, "Partner deleted");
  }),

  adminUploadIcon: asyncHandler(async (req, res: Response) => {
    const storage = getStorageProvider();
    if (!storage) throw new AppError("File uploads not configured", 503);

    const file = (req as MulterRequest).file;
    if (!file) throw new ValidationError(["No file provided"]);

    const result = await storage.upload({
      buffer: file.buffer,
      originalName: file.originalname,
      contentType: file.mimetype,
      folder: "referral",
    });

    sendSuccess(res, { imageUrl: result.url }, "Icon uploaded", 201);
  }),
};
