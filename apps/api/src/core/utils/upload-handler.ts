import type { Request, Response } from "express";
import { AppError, ValidationError } from "@/core/errors/index.js";
import { getStorageProvider } from "@/integrations/storage/index.js";
import type { MulterRequest } from "@/core/types/request.js";
import { sendSuccess } from "./response.js";

export function handleImageUpload(
  folder: string,
  opts?: { bucket?: string; isPublic?: boolean },
) {
  return async (req: Request, res: Response) => {
    const storage = getStorageProvider();
    if (!storage) throw new AppError("File uploads not configured", 503);

    const file = (req as MulterRequest).file;
    if (!file) throw new ValidationError(["No file provided"]);

    const result = await storage.upload({
      buffer: file.buffer,
      originalName: file.originalname,
      contentType: file.mimetype,
      folder,
      bucket: opts?.bucket,
      isPublic: opts?.isPublic,
    });

    sendSuccess(res, { imageUrl: result.url }, "Image uploaded", 201);
  };
}
