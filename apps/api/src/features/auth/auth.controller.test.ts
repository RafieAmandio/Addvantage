import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { mockAuthMiddleware, TEST_USER } from "@/test/helpers.js";
import { errorHandler } from "@/core/middleware/error.middleware.js";

vi.mock("@/config/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { authController } from "./auth.controller.js";

function createApp() {
  const app = express();
  app.use(express.json());
  app.post("/logout", mockAuthMiddleware(TEST_USER), authController.logout);
  app.use(errorHandler);
  return app;
}

describe("POST /logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success on logout", async () => {
    const res = await request(createApp()).post("/logout");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Logged out");
    expect(res.body.data).toBeNull();
  });

  it("works with any authenticated user", async () => {
    const customUser = { id: "custom-user-42", email: "custom@test.com" };
    const app = express();
    app.use(express.json());
    app.post("/logout", mockAuthMiddleware(customUser), authController.logout);
    app.use(errorHandler);

    const res = await request(app).post("/logout");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
