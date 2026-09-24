import type { Request, Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { giveawayService } from "./giveaway.service.js";

export const giveawayController = {
  // Public: submit an entry.
  submit: asyncHandler(async (req: Request, res: Response) => {
    const result = await giveawayService.submit(req.body);
    sendSuccess(res, result, "Entry received", 201);
  }),

  // Admin: list all entries + total.
  adminList: asyncHandler(async (_req: Request, res: Response) => {
    const result = await giveawayService.list();
    sendSuccess(res, result);
  }),

  // Admin: draw a random not-yet-won winner.
  adminDraw: asyncHandler(async (_req: Request, res: Response) => {
    const winner = await giveawayService.draw();
    sendSuccess(res, winner, winner ? "Winner drawn" : "No eligible entries");
  }),
};
