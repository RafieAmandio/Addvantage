import type { Request } from "express";

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthRequest extends Request {
  user: AuthUser;
}

export interface OptionalAuthRequest extends Request {
  user?: AuthUser | null;
}

export interface AdminRequest extends AuthRequest {
  admin: {
    id: string;
    email: string;
    isAdmin: true;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}
