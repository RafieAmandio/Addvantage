import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "@/core/middleware/error.middleware.js";
import { NotFoundError } from "@/core/errors/index.js";
import { TEST_ADMIN, mockAdminMiddleware } from "@/test/helpers.js";

const { mockListApproved, mockGetApproved, mockListPending, mockGetForAdmin, mockCreate, mockApprove, mockReject } =
  vi.hoisted(() => ({
    mockListApproved: vi.fn(),
    mockGetApproved: vi.fn(),
    mockListPending: vi.fn(),
    mockGetForAdmin: vi.fn(),
    mockCreate: vi.fn(),
    mockApprove: vi.fn(),
    mockReject: vi.fn(),
  }));

vi.mock("../news.service.js", () => ({
  newsService: {
    listApproved: mockListApproved,
    getApproved: mockGetApproved,
    listPending: mockListPending,
    listRejected: vi.fn().mockResolvedValue({ content: [], total: 0, page: 1, limit: 20 }),
    getForAdmin: mockGetForAdmin,
    create: mockCreate,
    updateDraft: vi.fn().mockResolvedValue(null),
    approve: mockApprove,
    reject: mockReject,
  },
}));

import { newsController } from "../news.controller.js";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(mockAdminMiddleware(TEST_ADMIN));
  app.get("/", newsController.listApproved);
  app.get("/admin/pending", newsController.listPending);
  app.get("/admin/:id", newsController.getForAdmin);
  app.get("/:id", newsController.getApproved);
  app.post("/", newsController.create);
  app.put("/:id/approve", newsController.approve);
  app.put("/:id/reject", newsController.reject);
  app.use(errorHandler);
  return app;
}

describe("newsController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns paginated approved news", async () => {
      mockListApproved.mockResolvedValue({
        content: [{ id: "n1", headline: "Test" }],
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
    it("returns a single approved item", async () => {
      mockGetApproved.mockResolvedValue({ id: "n1", headline: "Breaking" });

      const res = await request(createApp()).get("/n1");

      expect(res.status).toBe(200);
      expect(res.body.data.headline).toBe("Breaking");
    });

    it("returns 404 when not found", async () => {
      mockGetApproved.mockRejectedValue(new NotFoundError("News item not found"));

      const res = await request(createApp()).get("/missing");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /admin/pending", () => {
    it("returns pending items", async () => {
      mockListPending.mockResolvedValue({ content: [], total: 0, page: 1, limit: 20 });

      const res = await request(createApp()).get("/admin/pending");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe("POST /", () => {
    it("creates a news item", async () => {
      mockCreate.mockResolvedValue({ id: "new-1" });

      const res = await request(createApp())
        .post("/")
        .send({
          headline: "Test headline",
          rephrased: "Rephrased text",
          analysis: "Analysis text",
          impact: "high",
          bias: "bullish",
          affects: ["SPY"],
          tags: [],
          author: "FRED",
          source_code: "FRED",
          source_url: null,
          raw_text: null,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe("new-1");
    });
  });

  describe("PUT /:id/approve", () => {
    it("approves a pending item", async () => {
      mockApprove.mockResolvedValue(null);

      const res = await request(createApp()).put("/n1/approve");

      expect(res.status).toBe(200);
      expect(mockApprove).toHaveBeenCalledWith("n1", TEST_ADMIN.id);
    });
  });

  describe("PUT /:id/reject", () => {
    it("rejects a pending item", async () => {
      mockReject.mockResolvedValue(null);

      const res = await request(createApp()).put("/n1/reject");

      expect(res.status).toBe(200);
      expect(mockReject).toHaveBeenCalledWith("n1", TEST_ADMIN.id);
    });
  });
});
