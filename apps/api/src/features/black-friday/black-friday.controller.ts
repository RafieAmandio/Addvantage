import type { Request, Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { handleImageUpload } from "@/core/utils/upload-handler.js";
import { blackFridayService } from "./black-friday.service.js";
import { blackFridayAdminService } from "./black-friday-admin.service.js";

export const blackFridayController = {
  draft: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await blackFridayService.draft(req.body), "Draft saved");
  }),

  submit: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await blackFridayService.submit(req.body), "Application received", 201);
  }),

  // BingX screenshots and transfer receipts both carry PII: same private bucket as early access.
  uploadProof: asyncHandler(handleImageUpload("black-friday", { bucket: "payment-proofs", isPublic: false })),

  adminList: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await blackFridayAdminService.list(), "Applications");
  }),

  adminProofUrl: asyncHandler(async (req: Request, res: Response) => {
    const kind = req.params.kind === "payment" ? "payment" : "bingx";
    sendSuccess(res, await blackFridayAdminService.proofUrl(req.params.id as string, kind), "Proof URL");
  }),

  adminApprove: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await blackFridayAdminService.approve(req.params.id as string), "Application approved", 201);
  }),

  adminReject: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await blackFridayAdminService.reject(req.params.id as string, req.body?.note), "Application rejected");
  }),

  adminDinner: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await blackFridayAdminService.setDinnerInvite(req.params.id as string, req.body.invited), "Dinner invite updated");
  }),
};
