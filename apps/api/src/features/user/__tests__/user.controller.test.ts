import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "@/core/middleware/error.middleware.js";
import { NotFoundError } from "@/core/errors/index.js";
import { TEST_USER, mockAuthMiddleware } from "@/test/helpers.js";
import type { AuthUser } from "@/core/types/request.js";

const { mockGetMe, mockUpdateProfile } = vi.hoisted(() => ({
  mockGetMe: vi.fn(),
  mockUpdateProfile: vi.fn(),
}));

vi.mock("../user.service.js", () => ({
  userService: {
    getMe: mockGetMe,
    updateProfile: mockUpdateProfile,
  },
}));

import { userController } from "../user.controller.js";

function createApp(user: AuthUser = TEST_USER) {
  const app = express();
  app.use(express.json());
  app.use(mockAuthMiddleware(user));
  app.get("/me", userController.getMe);
  app.put("/profile", userController.updateProfile);
  app.use(errorHandler);
  return app;
}

describe("userController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /me", () => {
    it("returns the current user profile", async () => {
      mockGetMe.mockResolvedValue({
        id: TEST_USER.id,
        email: TEST_USER.email,
        handle: "trader1",
        tier: "free",
      });

      const res = await request(createApp()).get("/me");

      expect(res.status).toBe(200);
      expect(res.body.data.handle).toBe("trader1");
      expect(mockGetMe).toHaveBeenCalledWith(TEST_USER.id);
    });

    it("returns 404 when profile not found", async () => {
      mockGetMe.mockRejectedValue(new NotFoundError("Profile not found"));

      const res = await request(createApp()).get("/me");

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /profile", () => {
    it("updates profile fields", async () => {
      mockUpdateProfile.mockResolvedValue(undefined);

      const res = await request(createApp())
        .put("/profile")
        .send({ handle: "newhandle", tradingLength: "1-3" });

      expect(res.status).toBe(200);
      expect(mockUpdateProfile).toHaveBeenCalledWith(TEST_USER.id, {
        handle: "newhandle",
        tradingLength: "1-3",
      });
    });

    it("accepts partial updates", async () => {
      mockUpdateProfile.mockResolvedValue(undefined);

      const res = await request(createApp())
        .put("/profile")
        .send({ yearlyGoal: "10% return" });

      expect(res.status).toBe(200);
      expect(mockUpdateProfile).toHaveBeenCalledWith(TEST_USER.id, {
        yearlyGoal: "10% return",
      });
    });
  });
});
