import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

const { mockSignOut } = vi.hoisted(() => ({
  mockSignOut: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      admin: { signOut: mockSignOut },
    },
  }),
}));

import { authController } from "./auth.controller.js";
import { mockAuthMiddleware, TEST_USER } from "@/test/helpers.js";
import { errorHandler } from "@/core/middleware/error.middleware.js";

/* ------------------------------------------------------------------ */
/*  App factory                                                        */
/* ------------------------------------------------------------------ */

function createApp() {
  const app = express();
  app.use(express.json());
  app.post("/logout", mockAuthMiddleware(TEST_USER), authController.logout);
  app.use(errorHandler);
  return app;
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("POST /logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success on successful logout", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const app = createApp();
    const res = await request(app).post("/logout");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Logged out");
    expect(res.body.data).toBeNull();
    expect(mockSignOut).toHaveBeenCalledWith(TEST_USER.id);
  });

  it("still returns success when signOut encounters an error", async () => {
    mockSignOut.mockResolvedValue({
      error: { message: "User session not found", status: 404 },
    });

    const app = createApp();
    const res = await request(app).post("/logout");

    // Controller logs the error but still responds with success
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Logged out");
    expect(res.body.data).toBeNull();
  });

  it("calls signOut with the authenticated user id", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const customUser = { id: "custom-user-42", email: "custom@test.com" };
    const app = express();
    app.use(express.json());
    app.post("/logout", mockAuthMiddleware(customUser), authController.logout);
    app.use(errorHandler);

    await request(app).post("/logout");

    expect(mockSignOut).toHaveBeenCalledWith("custom-user-42");
  });

  it("handles signOut rejecting with an exception gracefully", async () => {
    // If supabase.auth.admin.signOut throws (network error etc.),
    // asyncHandler catches it and passes to errorHandler
    mockSignOut.mockRejectedValue(new Error("Network timeout"));

    const app = createApp();
    const res = await request(app).post("/logout");

    // asyncHandler catches the rejection and passes to errorHandler
    // which returns 500 for unknown errors
    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Internal server error");
  });
});
