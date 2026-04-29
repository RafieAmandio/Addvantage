import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "@/core/middleware/error.middleware.js";
import { NotFoundError } from "@/core/errors/index.js";
import { TEST_USER, mockAuthMiddleware } from "@/test/helpers.js";

const { mockList, mockGetById, mockCreatePin } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockGetById: vi.fn(),
  mockCreatePin: vi.fn(),
}));

vi.mock("../timeline.service.js", () => ({
  timelineService: {
    list: mockList,
    getById: mockGetById,
    createPin: mockCreatePin,
  },
}));

import { timelineController } from "../timeline.controller.js";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(mockAuthMiddleware(TEST_USER));
  app.get("/", timelineController.list);
  app.get("/:id", timelineController.getById);
  app.post("/pin", timelineController.createPin);
  app.use(errorHandler);
  return app;
}

describe("timelineController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns timeline events", async () => {
      mockList.mockResolvedValue([
        { id: "e1", kind: "news", title: "Fed hike" },
      ]);

      const res = await request(createApp()).get("/");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it("passes query params to service", async () => {
      mockList.mockResolvedValue([]);

      await request(createApp()).get("/?limit=10&kinds=news,macro");

      expect(mockList).toHaveBeenCalledWith(
        expect.objectContaining({ limit: "10", kinds: "news,macro" }),
      );
    });
  });

  describe("GET /:id", () => {
    it("returns a single event", async () => {
      mockGetById.mockResolvedValue({ id: "e1", kind: "news" });

      const res = await request(createApp()).get("/e1");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("e1");
    });

    it("returns 404 for missing event", async () => {
      mockGetById.mockRejectedValue(new NotFoundError("Event not found"));

      const res = await request(createApp()).get("/missing");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /pin", () => {
    it("creates a pin", async () => {
      mockCreatePin.mockResolvedValue({ id: "pin-1" });

      const res = await request(createApp())
        .post("/pin")
        .send({
          title: "My note",
          symbol: "AAPL",
          occurredAt: "2025-06-15T10:00:00.000Z",
        });

      expect(res.status).toBe(201);
      expect(mockCreatePin).toHaveBeenCalledWith(TEST_USER.id, expect.any(Object));
    });
  });
});
