import type { Request, Response, NextFunction } from "express";
import { shortLinksService } from "@/features/short-links/short-links.service.js";

const MEET_HOST = "meet.tradevantage.gg";
const FALLBACK = "https://tradevantage.gg";

// Host-based shortlink. meet.tradevantage.gg (routed to this API app in
// Dokploy) 302s to the Zoom URL stored in short_links; every other host falls
// through to the normal routes untouched. express-async-errors handles throws.
export async function meetRedirect(req: Request, res: Response, next: NextFunction) {
  const host = (req.hostname || "").toLowerCase();
  if (host !== MEET_HOST) return next();

  const url = await shortLinksService.getTarget("meet");
  res.redirect(302, url ?? FALLBACK);
}
