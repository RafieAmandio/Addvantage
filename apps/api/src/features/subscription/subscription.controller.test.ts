import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "@/core/middleware/error.middleware.js";
import { AppError } from "@/core/errors/index.js";
import { TEST_USER, mockAuthMiddleware } from "@/test/helpers.js";
import type { AuthUser } from "@/core/types/request.js";

const { mockGetStatus, mockGetHistory, mockHandleWebhook, mockCreateInvoice } = vi.hoisted(() => ({
  mockGetStatus: vi.fn(),
  mockGetHistory: vi.fn(),
  mockHandleWebhook: vi.fn(),
  mockCreateInvoice: vi.fn(),
}));

vi.mock("./subscription.service.js", () => ({
  subscriptionService: {
    getStatus: mockGetStatus,
    getHistory: mockGetHistory,
    handleWebhook: mockHandleWebhook,
    createInvoice: mockCreateInvoice,
  },
}));

import { subscriptionController } from "./subscription.controller.js";

function createApp(user: AuthUser = TEST_USER) {
  const app = express();
  app.use(express.json());
  app.use(mockAuthMiddleware(user));
  app.get("/status", subscriptionController.getStatus);
  app.get("/history", subscriptionController.getHistory);
  app.post("/payment", subscriptionController.handleWebhook);
  app.post("/invoice", subscriptionController.createInvoice);
  app.use(errorHandler);
  return app;
}

describe("subscriptionController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /status", () => {
    it("returns subscription status", async () => {
      mockGetStatus.mockResolvedValue({
        tier: "vip",
        renewsAt: new Date("2025-09-01"),
        signedLiability: true,
        joinedAt: new Date("2025-01-01"),
      });

      const res = await request(createApp()).get("/status");

      expect(res.status).toBe(200);
      expect(res.body.data.tier).toBe("vip");
      expect(res.body.data.signedLiability).toBe(true);
      expect(mockGetStatus).toHaveBeenCalledWith(TEST_USER.id);
    });

    it("returns 404 when profile not found", async () => {
      mockGetStatus.mockRejectedValue(new AppError("Profile not found", 404));

      const res = await request(createApp()).get("/status");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /history", () => {
    it("returns payment history", async () => {
      mockGetHistory.mockResolvedValue([
        {
          id: "pay-1",
          externalRef: "tv-abc-123",
          provider: "xendit",
          amount: 150000,
          currency: "IDR",
          status: "paid",
          tier: "pro",
          paidAt: new Date("2025-06-10"),
          createdAt: new Date("2025-06-10"),
        },
      ]);

      const res = await request(createApp()).get("/history");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe("paid");
    });

    it("returns empty array when no history", async () => {
      mockGetHistory.mockResolvedValue([]);

      const res = await request(createApp()).get("/history");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it("respects limit query param", async () => {
      mockGetHistory.mockResolvedValue([]);

      await request(createApp()).get("/history?limit=10");

      expect(mockGetHistory).toHaveBeenCalledWith(TEST_USER.id, 10);
    });

    it("caps limit at 200", async () => {
      mockGetHistory.mockResolvedValue([]);

      await request(createApp()).get("/history?limit=9999");

      expect(mockGetHistory).toHaveBeenCalledWith(TEST_USER.id, 200);
    });
  });

  describe("POST /payment", () => {
    it("handles webhook and returns result", async () => {
      mockHandleWebhook.mockResolvedValue({ received: true });

      const res = await request(createApp())
        .post("/payment")
        .send({ event: "checkout_completed" });

      expect(res.status).toBe(200);
      expect(res.body.data.received).toBe(true);
    });
  });

  describe("POST /invoice", () => {
    it("creates an invoice and returns 201", async () => {
      mockCreateInvoice.mockResolvedValue({
        id: "pay-uuid",
        externalRef: "tv-abc-123-hex",
        invoiceUrl: "https://checkout.xendit.co/inv-123",
        amount: 150000,
        currency: "IDR",
        tier: "pro",
        status: "pending",
      });

      const res = await request(createApp())
        .post("/invoice")
        .send({ tier: "pro", amount: 150000, currency: "IDR" });

      expect(res.status).toBe(201);
      expect(res.body.data.invoiceUrl).toContain("xendit");
      expect(res.body.data.tier).toBe("pro");
      expect(mockCreateInvoice).toHaveBeenCalledWith(TEST_USER.id, {
        tier: "pro",
        amount: 150000,
        currency: "IDR",
      });
    });

    it("returns 503 when payment provider not configured", async () => {
      mockCreateInvoice.mockRejectedValue(new AppError("Payment provider not configured", 503));

      const res = await request(createApp())
        .post("/invoice")
        .send({ tier: "pro", amount: 150000 });

      expect(res.status).toBe(503);
    });
  });
});
