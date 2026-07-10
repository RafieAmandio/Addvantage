import type { Request, Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { handleImageUpload } from "@/core/utils/upload-handler.js";
import { earlyAccessService } from "./early-access.service.js";

export const earlyAccessController = {
  // Body is already validated + parsed by the `validate` middleware.
  submit: asyncHandler(async (req: Request, res: Response) => {
    const result = await earlyAccessService.submit(req.body);
    sendSuccess(res, result, "Application received", 201);
  }),

  uploadProof: asyncHandler(handleImageUpload("payment-proof")),
};
