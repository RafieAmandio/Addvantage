import type { Request, Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { handleImageUpload } from "@/core/utils/upload-handler.js";
import { earlyAccessService } from "./early-access.service.js";

export const earlyAccessController = {
  // Body is already validated + parsed by the `validate` middleware.
  lead: asyncHandler(async (req: Request, res: Response) => {
    const result = await earlyAccessService.startLead(req.body);
    sendSuccess(res, result, "Lead saved");
  }),

  submit: asyncHandler(async (req: Request, res: Response) => {
    const result = await earlyAccessService.submit(req.body);
    sendSuccess(res, result, "Application received", 201);
  }),

  // Payment receipts contain PII, so they go to a PRIVATE bucket. The upload
  // returns the object key (no public URL); reviewers resolve it via the service
  // role / a signed URL.
  uploadProof: asyncHandler(
    handleImageUpload("payment-proof", { bucket: "payment-proofs", isPublic: false }),
  ),
};
