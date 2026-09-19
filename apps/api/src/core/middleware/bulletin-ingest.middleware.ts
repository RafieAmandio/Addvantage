import type { Request, Response, NextFunction } from "express";
import { env } from "@/config/env.js";
import { UnauthorizedError } from "@/core/errors/index.js";

// Guards POST /bulletin/ingest with a static shared secret sent as a Bearer
// token. Jeff (the WhatsApp Hermes agent) calls this, so it needs no user JWT.
// If BULLETIN_INGEST_TOKEN is unset the endpoint is effectively disabled.
export function bulletinIngestAuth(req: Request, _res: Response, next: NextFunction) {
  const token = env.BULLETIN_INGEST_TOKEN;
  const header = req.headers.authorization ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token || !provided || provided !== token) {
    throw new UnauthorizedError("Invalid ingest token");
  }
  next();
}
