import { createClient } from "@supabase/supabase-js";
import type { Request, Response, NextFunction } from "express";
import { env } from "../../config/env.js";
import { UnauthorizedError } from "../errors/index.js";
import type { AuthUser } from "../types/request.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) throw new UnauthorizedError("Missing authorization token");

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new UnauthorizedError("Invalid or expired token");

  (req as Request & { user: AuthUser }).user = {
    id: data.user.id,
    email: data.user.email ?? "",
  };

  next();
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    (req as Request & { user?: AuthUser | null }).user = null;
    return next();
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    (req as Request & { user?: AuthUser | null }).user = null;
    return next();
  }

  (req as Request & { user: AuthUser }).user = {
    id: data.user.id,
    email: data.user.email ?? "",
  };

  next();
}
