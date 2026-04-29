import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "@/core/middleware/error.middleware.js";
import { NotFoundError } from "@/core/errors/index.js";

const { mockListPublished, mockGetByIdOrSlug } = vi.hoisted(() => ({
  mockListPublished: vi.fn(),
  mockGetByIdOrSlug: vi.fn(),
}));

vi.mock("../education.service.js", () => ({
  educationService: {
    listPublished: mockListPublished,
    getByIdOrSlug: mockGetByIdOrSlug,
  },
}));

import { educationController } from "../education.controller.js";

function createApp() {
  const app = express();
  app.get("/", educationController.list);
  app.get("/:id", educationController.getByIdOrSlug);
  app.use(errorHandler);
  return app;
}

describe("educationController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns list of primers", async () => {
      mockListPublished.mockResolvedValue([
        { id: "p1", title: "Intro to Trading", slug: "intro" },
      ]);

      const res = await request(createApp()).get("/");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe("Intro to Trading");
    });

    it("respects limit query param", async () => {
      mockListPublished.mockResolvedValue([]);

      await request(createApp()).get("/?limit=5");

      expect(mockListPublished).toHaveBeenCalledWith(5);
    });

    it("uses default limit when not provided", async () => {
      mockListPublished.mockResolvedValue([]);

      await request(createApp()).get("/");

      expect(mockListPublished).toHaveBeenCalledWith(undefined);
    });
  });

  describe("GET /:id", () => {
    it("returns a primer by id", async () => {
      mockGetByIdOrSlug.mockResolvedValue({ id: "p1", title: "Primer", body: "content" });

      const res = await request(createApp()).get("/p1");

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Primer");
    });

    it("returns a primer by slug", async () => {
      mockGetByIdOrSlug.mockResolvedValue({ id: "p1", title: "Primer", slug: "intro" });

      const res = await request(createApp()).get("/intro");

      expect(res.status).toBe(200);
      expect(mockGetByIdOrSlug).toHaveBeenCalledWith("intro");
    });

    it("returns 404 when not found", async () => {
      mockGetByIdOrSlug.mockRejectedValue(new NotFoundError("Primer not found"));

      const res = await request(createApp()).get("/missing");

      expect(res.status).toBe(404);
    });
  });
});
