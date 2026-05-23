import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, ForbiddenError } from "@/core/errors/index.js";

vi.mock("../consult.repository.js", () => ({
  consultRepository: {
    listSessions: vi.fn(),
    createSession: vi.fn(),
    findSessionById: vi.fn(),
    renameSession: vi.fn(),
    deleteSession: vi.fn(),
    listMessages: vi.fn(),
    createMessage: vi.fn(),
    touchSession: vi.fn(),
    updateSessionFlags: vi.fn(),
    listAllSessions: vi.fn(),
    getSessionStats: vi.fn(),
    getLatestMessage: vi.fn(),
  },
}));

vi.mock("@/integrations/telegram/notify.js", () => ({
  notifyAdminsConsult: vi.fn().mockResolvedValue(undefined),
}));

import { consultService } from "../consult.service.js";
import { consultRepository } from "../consult.repository.js";

const repo = vi.mocked(consultRepository);

const mockSession = (overrides: Partial<{ id: string; userId: string }> = {}) => ({
  id: overrides.id ?? "session-1",
  userId: overrides.userId ?? "user-1",
  title: "Test session",
  status: "open",
  unreadAdmin: false,
  unreadUser: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("consultService", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("listMessages — ownership", () => {
    it("returns messages for session owner", async () => {
      repo.findSessionById.mockResolvedValue(mockSession({ userId: "user-1" }) as never);
      repo.listMessages.mockResolvedValue([{ id: "m-1", role: "user", content: "hi" }] as never);

      const result = await consultService.listMessages("user-1", "session-1");
      expect(result).toHaveLength(1);
    });

    it("throws ForbiddenError for non-owner", async () => {
      repo.findSessionById.mockResolvedValue(mockSession({ userId: "user-1" }) as never);
      await expect(
        consultService.listMessages("user-other", "session-1"),
      ).rejects.toThrow(ForbiddenError);
    });

    it("throws NotFoundError for missing session", async () => {
      repo.findSessionById.mockResolvedValue(null as never);
      await expect(
        consultService.listMessages("user-1", "missing"),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("appendMessage — ownership", () => {
    it("allows owner to append", async () => {
      repo.findSessionById.mockResolvedValue(mockSession({ userId: "user-1" }) as never);
      repo.createMessage.mockResolvedValue({ id: "m-1" } as never);
      repo.touchSession.mockResolvedValue(undefined as never);
      repo.updateSessionFlags.mockResolvedValue(undefined as never);

      const result = await consultService.appendMessage("user-1", "session-1", {
        role: "user",
        content: "hello",
      });
      expect(result.id).toBe("m-1");
    });

    it("blocks non-owner from appending", async () => {
      repo.findSessionById.mockResolvedValue(mockSession({ userId: "user-1" }) as never);
      await expect(
        consultService.appendMessage("user-other", "session-1", {
          role: "user",
          content: "hi",
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("sets awaiting_reply flag when user sends", async () => {
      repo.findSessionById.mockResolvedValue(mockSession({ userId: "user-1" }) as never);
      repo.createMessage.mockResolvedValue({ id: "m-1" } as never);
      repo.touchSession.mockResolvedValue(undefined as never);
      repo.updateSessionFlags.mockResolvedValue(undefined as never);

      await consultService.appendMessage("user-1", "session-1", {
        role: "user",
        content: "hello",
      });

      expect(repo.updateSessionFlags).toHaveBeenCalledWith("session-1", {
        unreadAdmin: true,
        status: "awaiting_reply",
      });
    });
  });

  describe("renameSession", () => {
    it("renames when user owns session", async () => {
      repo.renameSession.mockResolvedValue({ count: 1 } as never);
      await consultService.renameSession("user-1", "session-1", "New title");
      expect(repo.renameSession).toHaveBeenCalledWith("session-1", "user-1", "New title");
    });

    it("throws NotFoundError when rename affects 0 rows", async () => {
      repo.renameSession.mockResolvedValue({ count: 0 } as never);
      await expect(
        consultService.renameSession("user-1", "missing", "Title"),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteSession", () => {
    it("deletes when user owns session", async () => {
      repo.deleteSession.mockResolvedValue({ count: 1 } as never);
      await consultService.deleteSession("user-1", "session-1");
      expect(repo.deleteSession).toHaveBeenCalledWith("session-1", "user-1");
    });

    it("throws NotFoundError when delete affects 0 rows", async () => {
      repo.deleteSession.mockResolvedValue({ count: 0 } as never);
      await expect(
        consultService.deleteSession("user-1", "missing"),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("adminSendMessage", () => {
    it("sends admin reply and updates flags", async () => {
      repo.findSessionById.mockResolvedValue(mockSession() as never);
      repo.createMessage.mockResolvedValue({ id: "m-admin" } as never);
      repo.touchSession.mockResolvedValue(undefined as never);
      repo.updateSessionFlags.mockResolvedValue(undefined as never);

      const result = await consultService.adminSendMessage("admin-1", "session-1", "Reply");
      expect(result.id).toBe("m-admin");
      expect(repo.createMessage).toHaveBeenCalledWith(
        expect.objectContaining({ role: "admin", userId: "admin-1" }),
      );
      expect(repo.updateSessionFlags).toHaveBeenCalledWith("session-1", {
        unreadUser: true,
        status: "open",
      });
    });

    it("throws NotFoundError for missing session", async () => {
      repo.findSessionById.mockResolvedValue(null as never);
      await expect(
        consultService.adminSendMessage("admin-1", "missing", "Reply"),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("pollSession", () => {
    it("returns hasNew=false when no messages", async () => {
      repo.findSessionById.mockResolvedValue(mockSession({ userId: "user-1" }) as never);
      repo.getLatestMessage.mockResolvedValue(null as never);
      const result = await consultService.pollSession("user-1", "session-1");
      expect(result.hasNew).toBe(false);
    });

    it("throws ForbiddenError for non-owner", async () => {
      repo.findSessionById.mockResolvedValue(mockSession({ userId: "user-1" }) as never);
      await expect(
        consultService.pollSession("user-other", "session-1"),
      ).rejects.toThrow(ForbiddenError);
    });

    it("returns hasNew=true when newer message exists", async () => {
      repo.findSessionById.mockResolvedValue(mockSession({ userId: "user-1" }) as never);
      const now = new Date();
      const earlier = new Date(now.getTime() - 60000);
      repo.getLatestMessage.mockResolvedValue({ id: "m-1", createdAt: now } as never);
      const result = await consultService.pollSession("user-1", "session-1", earlier.toISOString());
      expect(result.hasNew).toBe(true);
    });
  });
});
