import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "@/core/middleware/error.middleware.js";
import { TEST_USER, mockAuthMiddleware } from "@/test/helpers.js";

const { mockListEvents, mockGetCorrelatedNews } = vi.hoisted(() => ({
  mockListEvents: vi.fn(),
  mockGetCorrelatedNews: vi.fn(),
}));

vi.mock("../calendar.service.js", () => ({
  calendarService: {
    listEvents: mockListEvents,
    getCorrelatedNews: mockGetCorrelatedNews,
  },
}));

import { calendarController } from "../calendar.controller.js";

function createApp() {
  const app = express();
  app.use(mockAuthMiddleware(TEST_USER));
  app.get("/", calendarController.listEvents);
  app.get("/:id/correlation", calendarController.getCorrelation);
  app.use(errorHandler);
  return app;
}

describe("calendarController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns events for symbols", async () => {
      mockListEvents.mockResolvedValue([
        { id: "ev1", symbol: "AAPL", kind: "earnings" },
      ]);

      const res = await request(createApp()).get("/?symbols=AAPL");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it("sets private cache header", async () => {
      mockListEvents.mockResolvedValue([]);

      const res = await request(createApp()).get("/?symbols=AAPL");

      expect(res.headers["cache-control"]).toContain("private");
    });

    it("returns 400 for missing symbols", async () => {
      const res = await request(createApp()).get("/");

      expect(res.status).toBe(400);
    });
  });

  describe("GET /:id/correlation", () => {
    it("returns correlated news items", async () => {
      mockGetCorrelatedNews.mockResolvedValue([
        { id: "n1", headline: "Apple earnings beat" },
      ]);

      const res = await request(createApp()).get("/ev1/correlation");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });
});
