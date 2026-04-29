import { jwtVerify } from "jose";
import type { Request, Response, NextFunction } from "express";
import { env } from "../../config/env.js";
import { UnauthorizedError } from "../errors/index.js";
import type { AuthUser } from "../types/request.js";

const secret = new TextEncoder().encode(env.JWT_SECRET);

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) throw new UnauthorizedError("Missing authorization token");

  try {
    const { payload } = await jwtVerify(token, secret);

    const sub = payload.sub;
    const email = (payload.email as string) ?? "";
    if (!sub) throw new UnauthorizedError("Invalid token: missing sub");

    (req as Request & { user: AuthUser }).user = { id: sub, email };
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError("Invalid or expired token");
  }

  next();
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    (req as Request & { user?: AuthUser | null }).user = null;
    return next();
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    const sub = payload.sub;
    const email = (payload.email as string) ?? "";
    if (!sub) {
      (req as Request & { user?: AuthUser | null }).user = null;
      return next();
    }

    (req as Request & { user: AuthUser }).user = { id: sub, email };
  } catch {
    (req as Request & { user?: AuthUser | null }).user = null;
  }

  next();
}
