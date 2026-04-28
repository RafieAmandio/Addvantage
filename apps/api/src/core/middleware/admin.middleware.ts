import { createClient } from "@supabase/supabase-js";
import type { Request, Response, NextFunction } from "express";
import { env } from "../../config/env.js";
import { ForbiddenError, UnauthorizedError } from "../errors/index.js";
import type { AuthUser } from "../types/request.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const user = (req as Request & { user?: AuthUser }).user;
  if (!user) throw new UnauthorizedError();

  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!data?.is_admin) throw new ForbiddenError("Admin access required");

  (req as Request & { admin: { id: string; email: string; isAdmin: true } }).admin = {
    id: user.id,
    email: user.email,
    isAdmin: true,
  };

  next();
}
