import type { Request, Response, NextFunction } from "express";
import type { AuthUser } from "@/core/types/request.js";

export const TEST_USER: AuthUser = {
  id: "user-test-001",
  email: "test@tradevantage.local",
};

export const TEST_ADMIN: AuthUser = {
  id: "admin-test-001",
  email: "admin@tradevantage.local",
};

export function mockAuthMiddleware(user: AuthUser = TEST_USER) {
  return (req: Request, _res: Response, next: NextFunction) => {
    (req as Request & { user: AuthUser }).user = user;
    next();
  };
}

export function mockAdminMiddleware(user: AuthUser = TEST_ADMIN) {
  return (req: Request, _res: Response, next: NextFunction) => {
    (req as Request & { user: AuthUser }).user = user;
    (req as Request & { admin: { id: string; email: string; isAdmin: true } }).admin = {
      id: user.id,
      email: user.email,
      isAdmin: true,
    };
    next();
  };
}
