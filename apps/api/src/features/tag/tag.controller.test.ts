import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "@/core/middleware/error.middleware.js";

const { mockGetCounts, mockListNewsByTag } = vi.hoisted(() => ({
  mockGetCounts: vi.fn(),
  mockListNewsByTag: vi.fn(),
}));

vi.mock("./tag.service.js", () => ({
  tagService: {
    getCounts: mockGetCounts,
  },
}));

vi.mock("./tag.repository.js", () => ({
  tagRepository: {
    listNewsByTag: mockListNewsByTag,
  },
}));

import { tagController } from "./tag.controller.js";

function createApp() {
  const app = express();
  app.get("/counts", tagController.counts);
  app.get("/:tag/news", tagController.newsByTag);
  app.use(errorHandler);
  return app;
}

describe("tagController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /counts", () => {
    it("returns tag counts with cache header", async () => {
      mockGetCounts.mockResolvedValue([
        { tag: "#macro", newsCount: 5, primerCount: 1, total: 6 },
      ]);

      const res = await request(createApp()).get("/counts");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].tag).toBe("#macro");
      expect(res.headers["cache-control"]).toContain("s-maxage=120");
    });
  });

  describe("GET /:tag/news", () => {
    it("returns news for a tag", async () => {
      mockListNewsByTag.mockResolvedValue([
        { id: "n1", headline: "Fed update", tags: ["#macro"] },
      ]);

      const res = await request(createApp()).get("/%23macro/news");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it("respects limit param", async () => {
      mockListNewsByTag.mockResolvedValue([]);

      await request(createApp()).get("/%23macro/news?limit=10");

      expect(mockListNewsByTag).toHaveBeenCalledWith("#macro", 10);
    });

    it("caps limit at 200", async () => {
      mockListNewsByTag.mockResolvedValue([]);

      await request(createApp()).get("/%23macro/news?limit=999");

      expect(mockListNewsByTag).toHaveBeenCalledWith("#macro", 200);
    });
  });
});
