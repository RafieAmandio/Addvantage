import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "@/core/middleware/error.middleware.js";

const { mockFindAll } = vi.hoisted(() => ({
  mockFindAll: vi.fn(),
}));

vi.mock("./source.repository.js", () => ({
  sourceRepository: {
    findAll: mockFindAll,
  },
}));

import { sourceController } from "./source.controller.js";

function createApp() {
  const app = express();
  app.get("/", sourceController.list);
  app.use(errorHandler);
  return app;
}

describe("sourceController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns all sources", async () => {
      mockFindAll.mockResolvedValue([
        { code: "FRED", name: "Federal Reserve", enabled: true },
        { code: "SC", name: "Seeking Alpha", enabled: true },
      ]);

      const res = await request(createApp()).get("/");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].code).toBe("FRED");
    });

    it("returns empty array when no sources", async () => {
      mockFindAll.mockResolvedValue([]);

      const res = await request(createApp()).get("/");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });
});
