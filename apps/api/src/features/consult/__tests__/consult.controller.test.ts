import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "@/core/middleware/error.middleware.js";
import { NotFoundError } from "@/core/errors/index.js";
import { TEST_USER, mockAuthMiddleware } from "@/test/helpers.js";

const {
  mockListSessions,
  mockCreateSession,
  mockRenameSession,
  mockDeleteSession,
  mockListMessages,
  mockAppendMessage,
  mockVerifyOwnership,
  mockGetUserTier,
  mockCheckDailyTokenCap,
  mockStreamResponse,
} = vi.hoisted(() => ({
  mockListSessions: vi.fn(),
  mockCreateSession: vi.fn(),
  mockRenameSession: vi.fn(),
  mockDeleteSession: vi.fn(),
  mockListMessages: vi.fn(),
  mockAppendMessage: vi.fn(),
  mockVerifyOwnership: vi.fn(),
  mockGetUserTier: vi.fn(),
  mockCheckDailyTokenCap: vi.fn(),
  mockStreamResponse: vi.fn(),
}));

vi.mock("../consult.service.js", () => ({
  consultService: {
    listSessions: mockListSessions,
    createSession: mockCreateSession,
    renameSession: mockRenameSession,
    deleteSession: mockDeleteSession,
    listMessages: mockListMessages,
    appendMessage: mockAppendMessage,
    verifySessionOwnership: mockVerifyOwnership,
    getUserTier: mockGetUserTier,
    checkDailyTokenCap: mockCheckDailyTokenCap,
    streamResponse: mockStreamResponse,
  },
}));

vi.mock("@/integrations/storage/index.js", () => ({
  getStorageProvider: () => null,
}));

import { consultController } from "../consult.controller.js";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(mockAuthMiddleware(TEST_USER));
  app.get("/sessions", consultController.listSessions);
  app.post("/sessions", consultController.createSession);
  app.put("/sessions/:id", consultController.renameSession);
  app.delete("/sessions/:id", consultController.deleteSession);
  app.get("/sessions/:id/messages", consultController.listMessages);
  app.post("/sessions/:id/messages", consultController.appendMessage);
  app.post("/stream", consultController.stream);
  app.use(errorHandler);
  return app;
}

describe("consultController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /sessions", () => {
    it("returns user sessions", async () => {
      mockListSessions.mockResolvedValue([
        { id: "s1", title: "My session", createdAt: "2025-06-15" },
      ]);

      const res = await request(createApp()).get("/sessions");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(mockListSessions).toHaveBeenCalledWith(TEST_USER.id, 50);
    });

    it("respects limit query param", async () => {
      mockListSessions.mockResolvedValue([]);

      await request(createApp()).get("/sessions?limit=10");

      expect(mockListSessions).toHaveBeenCalledWith(TEST_USER.id, 10);
    });
  });

  describe("POST /sessions", () => {
    it("creates a session", async () => {
      mockCreateSession.mockResolvedValue({ id: "new-s1" });

      const res = await request(createApp())
        .post("/sessions")
        .send({ title: "Test session" });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe("new-s1");
      expect(mockCreateSession).toHaveBeenCalledWith(TEST_USER.id, "Test session");
    });

    it("creates a session without title", async () => {
      mockCreateSession.mockResolvedValue({ id: "new-s2" });

      const res = await request(createApp())
        .post("/sessions")
        .send({});

      expect(res.status).toBe(201);
      expect(mockCreateSession).toHaveBeenCalledWith(TEST_USER.id, undefined);
    });
  });

  describe("PUT /sessions/:id", () => {
    it("renames a session", async () => {
      mockRenameSession.mockResolvedValue(undefined);

      const res = await request(createApp())
        .put("/sessions/s1")
        .send({ title: "New name" });

      expect(res.status).toBe(200);
      expect(mockRenameSession).toHaveBeenCalledWith(TEST_USER.id, "s1", "New name");
    });
  });

  describe("DELETE /sessions/:id", () => {
    it("deletes a session", async () => {
      mockDeleteSession.mockResolvedValue(undefined);

      const res = await request(createApp()).delete("/sessions/s1");

      expect(res.status).toBe(200);
      expect(mockDeleteSession).toHaveBeenCalledWith(TEST_USER.id, "s1");
    });
  });

  describe("GET /sessions/:id/messages", () => {
    it("returns messages for a session", async () => {
      mockListMessages.mockResolvedValue([
        { id: "m1", role: "user", content: "Hello" },
        { id: "m2", role: "assistant", content: "Hi there" },
      ]);

      const res = await request(createApp()).get("/sessions/s1/messages");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(mockListMessages).toHaveBeenCalledWith(TEST_USER.id, "s1", 200);
    });
  });

  describe("POST /sessions/:id/messages", () => {
    it("appends a message", async () => {
      mockAppendMessage.mockResolvedValue({ id: "m3", role: "user", content: "test" });

      const res = await request(createApp())
        .post("/sessions/s1/messages")
        .send({ role: "user", content: "test message" });

      expect(res.status).toBe(201);
      expect(mockAppendMessage).toHaveBeenCalledWith(
        TEST_USER.id,
        "s1",
        expect.objectContaining({ role: "user", content: "test message" }),
      );
    });
  });

  describe("POST /stream", () => {
    it("streams a response for VIP users", async () => {
      mockGetUserTier.mockResolvedValue("vip");
      mockStreamResponse.mockImplementation((_uid, _sid, _body, write) => {
        write("chunk1");
        write("chunk2");
      });

      const res = await request(createApp())
        .post("/stream")
        .send({ sessionId: "550e8400-e29b-41d4-a716-446655440000", body: "What is AAPL?" });

      expect(res.status).toBe(200);
      expect(res.text).toBe("chunk1chunk2");
    });

    it("blocks free users at daily cap", async () => {
      mockGetUserTier.mockResolvedValue("free");
      mockCheckDailyTokenCap.mockResolvedValue({ allowed: false });

      const res = await request(createApp())
        .post("/stream")
        .send({ sessionId: "550e8400-e29b-41d4-a716-446655440000", body: "test" });

      expect(res.status).toBe(429);
    });
  });
});
