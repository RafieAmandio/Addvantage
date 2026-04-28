import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "@/core/middleware/error.middleware.js";
import { TEST_USER, mockAuthMiddleware } from "@/test/helpers.js";
import type { AuthUser } from "@/core/types/request.js";

const { mockGetSubscriptionStatus, mockGetPaymentHistory } = vi.hoisted(() => ({
  mockGetSubscriptionStatus: vi.fn(),
  mockGetPaymentHistory: vi.fn(),
}));

vi.mock("@/config/database.js", () => ({
  prisma: {
    profile: {
      findUnique: mockGetSubscriptionStatus,
    },
    emailLog: {
      findMany: mockGetPaymentHistory,
    },
  },
}));

vi.mock("./subscription.service.js", () => ({
  subscriptionService: {
    handleWebhook: vi.fn(),
  },
}));

import { subscriptionController } from "./subscription.controller.js";

function createApp(user: AuthUser = TEST_USER) {
  const app = express();
  app.use(express.json());
  app.use(mockAuthMiddleware(user));
  app.get("/status", subscriptionController.getStatus);
  app.get("/history", subscriptionController.getHistory);
  app.use(errorHandler);
  return app;
}

describe("subscriptionController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /status", () => {
    it("returns subscription status", async () => {
      mockGetSubscriptionStatus.mockResolvedValue({
        tier: "vip",
        renewsAt: new Date("2025-09-01"),
        signedLiability: true,
        joinedAt: new Date("2025-01-01"),
      });

      const res = await request(createApp()).get("/status");

      expect(res.status).toBe(200);
      expect(res.body.data.tier).toBe("vip");
      expect(res.body.data.signedLiability).toBe(true);
    });

    it("returns 404 when profile not found", async () => {
      mockGetSubscriptionStatus.mockResolvedValue(null);

      const res = await request(createApp()).get("/status");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /history", () => {
    it("returns payment history", async () => {
      mockGetPaymentHistory.mockResolvedValue([
        {
          id: "log-1",
          kind: "dunning",
          provider: "brevo",
          sentAt: new Date("2025-06-10"),
          templateId: "42",
        },
      ]);

      const res = await request(createApp()).get("/history");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].kind).toBe("dunning");
    });

    it("returns empty array when no history", async () => {
      mockGetPaymentHistory.mockResolvedValue([]);

      const res = await request(createApp()).get("/history");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it("respects limit query param", async () => {
      mockGetPaymentHistory.mockResolvedValue([]);

      await request(createApp()).get("/history?limit=10");

      expect(mockGetPaymentHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          where: expect.objectContaining({
            profileId: TEST_USER.id,
          }),
        }),
      );
    });
  });
});
