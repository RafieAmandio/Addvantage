import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "@/core/middleware/error.middleware.js";

const { mockListBars } = vi.hoisted(() => ({
  mockListBars: vi.fn(),
}));

vi.mock("./chart.service.js", () => ({
  chartService: {
    listBars: mockListBars,
  },
}));

import { chartController } from "./chart.controller.js";

function createApp() {
  const app = express();
  app.get("/", chartController.listBars);
  app.use(errorHandler);
  return app;
}

describe("chartController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns bars data", async () => {
      mockListBars.mockResolvedValue({
        bars: [{ time: "2025-06-15", open: 100, high: 105, low: 99, close: 103 }],
      });

      const res = await request(createApp()).get("/?symbol=AAPL&interval=1d");

      expect(res.status).toBe(200);
      expect(res.body.data.bars).toHaveLength(1);
    });

    it("sets cache-control header", async () => {
      mockListBars.mockResolvedValue({ bars: [] });

      const res = await request(createApp()).get("/?symbol=AAPL");

      expect(res.headers["cache-control"]).toContain("s-maxage=60");
    });

    it("passes query params to service", async () => {
      mockListBars.mockResolvedValue({ bars: [] });

      await request(createApp()).get("/?symbol=TSLA&interval=1h&limit=500");

      expect(mockListBars).toHaveBeenCalledWith(
        expect.objectContaining({ symbol: "TSLA", interval: "1h" }),
      );
    });
  });
});
