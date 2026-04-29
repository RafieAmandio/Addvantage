import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "@/core/middleware/error.middleware.js";
import { TEST_ADMIN, mockAdminMiddleware } from "@/test/helpers.js";

const { mockListRuns, mockListSources } = vi.hoisted(() => ({
  mockListRuns: vi.fn(),
  mockListSources: vi.fn(),
}));

vi.mock("../ingestion.repository.js", () => ({
  ingestionRepository: {
    listRuns: mockListRuns,
    listSources: mockListSources,
  },
}));

import { ingestionController } from "../ingestion.controller.js";

function createApp() {
  const app = express();
  app.use(mockAdminMiddleware(TEST_ADMIN));
  app.get("/runs", ingestionController.listRuns);
  app.use(errorHandler);
  return app;
}

describe("ingestionController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /runs", () => {
    it("returns runs and sources", async () => {
      mockListRuns.mockResolvedValue([
        { id: "run-1", sourceCode: "FRED", status: "ok", itemsFetched: 10 },
      ]);
      mockListSources.mockResolvedValue([
        { code: "FRED", name: "Federal Reserve" },
      ]);

      const res = await request(createApp()).get("/runs");

      expect(res.status).toBe(200);
      expect(res.body.data.runs).toHaveLength(1);
      expect(res.body.data.sources).toHaveLength(1);
    });

    it("respects limit query param", async () => {
      mockListRuns.mockResolvedValue([]);
      mockListSources.mockResolvedValue([]);

      await request(createApp()).get("/runs?limit=25");

      expect(mockListRuns).toHaveBeenCalledWith(25);
    });

    it("caps limit at 500", async () => {
      mockListRuns.mockResolvedValue([]);
      mockListSources.mockResolvedValue([]);

      await request(createApp()).get("/runs?limit=9999");

      expect(mockListRuns).toHaveBeenCalledWith(500);
    });

    it("defaults to 100 when no limit", async () => {
      mockListRuns.mockResolvedValue([]);
      mockListSources.mockResolvedValue([]);

      await request(createApp()).get("/runs");

      expect(mockListRuns).toHaveBeenCalledWith(100);
    });
  });
});
