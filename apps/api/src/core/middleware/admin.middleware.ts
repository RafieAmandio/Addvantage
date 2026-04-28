import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.js";
import { ForbiddenError, UnauthorizedError } from "../errors/index.js";
import type { AuthUser } from "../types/request.js";

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const user = (req as Request & { user?: AuthUser }).user;
  if (!user) throw new UnauthorizedError();

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  });

  if (!profile?.isAdmin) throw new ForbiddenError("Admin access required");

  (req as Request & { admin: { id: string; email: string; isAdmin: true } }).admin = {
    id: user.id,
    email: user.email,
    isAdmin: true,
  };

  next();
}
