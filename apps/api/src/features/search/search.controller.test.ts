import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "@/core/middleware/error.middleware.js";

const { mockSearchApprovedNews } = vi.hoisted(() => ({
  mockSearchApprovedNews: vi.fn(),
}));

vi.mock("./search.repository.js", () => ({
  searchRepository: {
    searchApprovedNews: mockSearchApprovedNews,
  },
}));

import { searchController } from "./search.controller.js";

function createApp() {
  const app = express();
  app.get("/", searchController.search);
  app.use(errorHandler);
  return app;
}

describe("searchController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns search results", async () => {
      mockSearchApprovedNews.mockResolvedValue([
        { id: "n1", headline: "Fed raises rates" },
      ]);

      const res = await request(createApp()).get("/?q=fed&limit=10");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(mockSearchApprovedNews).toHaveBeenCalledWith("fed", "10");
    });

    it("returns empty array for no matches", async () => {
      mockSearchApprovedNews.mockResolvedValue([]);

      const res = await request(createApp()).get("/?q=nonexistent");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });
});
