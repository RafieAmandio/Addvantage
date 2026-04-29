import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "@/core/middleware/error.middleware.js";
import { NotFoundError } from "@/core/errors/index.js";
import { TEST_ADMIN, mockAdminMiddleware } from "@/test/helpers.js";

const {
  mockListPublished,
  mockGetPublished,
  mockGetStats,
  mockGetNewsForPlan,
  mockListAllForAdmin,
  mockCreate,
  mockPublish,
  mockClose,
  mockRemove,
} = vi.hoisted(() => ({
  mockListPublished: vi.fn(),
  mockGetPublished: vi.fn(),
  mockGetStats: vi.fn(),
  mockGetNewsForPlan: vi.fn(),
  mockListAllForAdmin: vi.fn(),
  mockCreate: vi.fn(),
  mockPublish: vi.fn(),
  mockClose: vi.fn(),
  mockRemove: vi.fn(),
}));

vi.mock("./plan.service.js", () => ({
  planService: {
    listPublished: mockListPublished,
    getPublished: mockGetPublished,
    getStats: mockGetStats,
    getNewsForPlan: mockGetNewsForPlan,
    listAllForAdmin: mockListAllForAdmin,
    listMyDrafts: vi.fn().mockResolvedValue({ content: [], total: 0, page: 1, limit: 20 }),
    getForAdmin: vi.fn().mockResolvedValue({ id: "p1" }),
    create: mockCreate,
    update: vi.fn().mockResolvedValue(null),
    publish: mockPublish,
    close: mockClose,
    remove: mockRemove,
  },
}));

import { planController } from "./plan.controller.js";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(mockAdminMiddleware(TEST_ADMIN));
  app.get("/stats", planController.getStats);
  app.get("/admin/all", planController.listAllForAdmin);
  app.get("/:id/news", planController.getNewsForPlan);
  app.get("/:id", planController.getPublished);
  app.get("/", planController.listPublished);
  app.post("/", planController.create);
  app.put("/:id/publish", planController.publish);
  app.put("/:id/close", planController.close);
  app.delete("/:id", planController.remove);
  app.use(errorHandler);
  return app;
}

describe("planController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns paginated published plans", async () => {
      mockListPublished.mockResolvedValue({
        content: [{ id: "p1", symbol: "AAPL" }],
        total: 1,
        page: 1,
        limit: 20,
      });

      const res = await request(createApp()).get("/");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.total).toBe(1);
    });
  });

  describe("GET /:id", () => {
    it("returns a published plan", async () => {
      mockGetPublished.mockResolvedValue({ id: "p1", symbol: "AAPL", status: "published" });

      const res = await request(createApp()).get("/p1");

      expect(res.status).toBe(200);
      expect(res.body.data.symbol).toBe("AAPL");
    });

    it("returns 404 for missing plan", async () => {
      mockGetPublished.mockRejectedValue(new NotFoundError("Plan not found"));

      const res = await request(createApp()).get("/missing");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /stats", () => {
    it("returns plan stats with cache header", async () => {
      mockGetStats.mockResolvedValue({ n: 10, winRate: 0.6, avgR: 1.5, byDirection: {} });

      const res = await request(createApp()).get("/stats");

      expect(res.status).toBe(200);
      expect(res.body.data.winRate).toBe(0.6);
      expect(res.headers["cache-control"]).toContain("s-maxage=300");
    });
  });

  describe("GET /:id/news", () => {
    it("returns news linked to a plan", async () => {
      mockGetNewsForPlan.mockResolvedValue([{ id: "n1", headline: "Fed update" }]);

      const res = await request(createApp()).get("/p1/news");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("POST /", () => {
    it("creates a plan", async () => {
      mockCreate.mockResolvedValue({ id: "new-1" });

      const res = await request(createApp())
        .post("/")
        .send({
          symbol: "AAPL",
          thesis: "Bull breakout",
          direction: "long",
          entry: 150,
          stop: 145,
          target: 170,
          r_multiple: 4,
          setups: [],
          tags: [],
          tier: "free",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe("new-1");
    });
  });

  describe("PUT /:id/publish", () => {
    it("publishes a plan", async () => {
      mockPublish.mockResolvedValue(null);

      const res = await request(createApp()).put("/p1/publish");

      expect(res.status).toBe(200);
      expect(mockPublish).toHaveBeenCalledWith("p1");
    });
  });

  describe("DELETE /:id", () => {
    it("removes a plan", async () => {
      mockRemove.mockResolvedValue(null);

      const res = await request(createApp()).delete("/p1");

      expect(res.status).toBe(200);
      expect(mockRemove).toHaveBeenCalledWith("p1");
    });
  });
});
