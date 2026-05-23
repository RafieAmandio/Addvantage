import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
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
};
