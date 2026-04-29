import { describe, it, expect, vi, beforeEach } from "vitest";
import express, { type Request, type Response, type NextFunction } from "express";
import request from "supertest";
import { requireAdmin } from "../admin.middleware.js";
import { errorHandler } from "../error.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";

vi.mock("@/config/database.js", () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/config/database.js";

const mockFindUnique = prisma.profile.findUnique as ReturnType<typeof vi.fn>;

interface TestUser {
  id: string;
  email: string;
}

/**
 * Build a test app that optionally injects `req.user` before requireAdmin.
 * Uses asyncHandler so thrown errors propagate to the Express error handler.
 */
function createApp(user?: TestUser) {
  const app = express();

  // Capture admin property set by the middleware
  let capturedAdmin: unknown = undefined;

  if (user) {
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as Request & { user: TestUser }).user = user;
      next();
    });
  }

  app.get(
    "/test",
    asyncHandler(requireAdmin),
    (req: Request, res: Response) => {
      capturedAdmin = (req as Request & { admin: unknown }).admin;
      res.status(200).json({ admin: capturedAdmin });
    },
  );

  app.use(errorHandler);

  return { app, getAdmin: () => capturedAdmin };
}

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no user on request", async () => {
    const { app } = createApp(); // no user injected
    const res = await request(app).get("/test");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("returns 403 when profile not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const { app } = createApp({ id: "user-1", email: "nobody@test.com" });
    const res = await request(app).get("/test");

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Admin access required");
  });

  it("returns 403 when profile.isAdmin is false", async () => {
    mockFindUnique.mockResolvedValue({ isAdmin: false });

    const { app } = createApp({ id: "user-2", email: "regular@test.com" });
    const res = await request(app).get("/test");

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Admin access required");
  });

  it("returns 200 and sets req.admin when profile is admin", async () => {
    mockFindUnique.mockResolvedValue({ isAdmin: true });

    const { app } = createApp({ id: "admin-1", email: "admin@test.com" });
    const res = await request(app).get("/test");

    expect(res.status).toBe(200);
    expect(res.body.admin).toEqual({
      id: "admin-1",
      email: "admin@test.com",
      isAdmin: true,
    });
  });

  it("passes correct user ID to prisma query", async () => {
    mockFindUnique.mockResolvedValue({ isAdmin: true });

    const { app } = createApp({ id: "lookup-id-99", email: "check@test.com" });
    await request(app).get("/test");

    expect(mockFindUnique).toHaveBeenCalledOnce();
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: "lookup-id-99" },
      select: { isAdmin: true },
    });
  });
});
