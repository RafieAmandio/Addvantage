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
    getDailyTokensUsed: vi.fn(),
    getProfileTier: vi.fn(),
  },
}));

vi.mock("@/config/openai.js", () => ({
  getOpenAI: vi.fn(() => null),
  LLM_MODEL: "gpt-4o-mini",
}));

import { consultService } from "../consult.service.js";
import { consultRepository } from "../consult.repository.js";
import { FREE_DAILY_TOKEN_CAP } from "../consult.lib.js";

const repo = vi.mocked(consultRepository);

const mockSession = (overrides: Partial<{ id: string; userId: string }> = {}) => ({
  id: overrides.id ?? "session-1",
  userId: overrides.userId ?? "user-1",
  title: "Test session",
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

  describe("getUserTier", () => {
    it("returns vip for vip profiles", async () => {
      repo.getProfileTier.mockResolvedValue({ tier: "vip" } as never);
      expect(await consultService.getUserTier("user-1")).toBe("vip");
    });

    it("defaults to free for unknown tiers", async () => {
      repo.getProfileTier.mockResolvedValue({ tier: "unknown" } as never);
      expect(await consultService.getUserTier("user-1")).toBe("free");
    });

    it("defaults to free when profile is null", async () => {
      repo.getProfileTier.mockResolvedValue(null as never);
      expect(await consultService.getUserTier("user-1")).toBe("free");
    });
  });

  describe("checkDailyTokenCap", () => {
    it("allows when under cap", async () => {
      repo.getDailyTokensUsed.mockResolvedValue([{ total: BigInt(100) }] as never);
      const result = await consultService.checkDailyTokenCap("user-1");
      expect(result.allowed).toBe(true);
      expect(result.used).toBe(100);
    });

    it("blocks when at cap", async () => {
      repo.getDailyTokensUsed.mockResolvedValue([{ total: BigInt(FREE_DAILY_TOKEN_CAP) }] as never);
      const result = await consultService.checkDailyTokenCap("user-1");
      expect(result.allowed).toBe(false);
    });

    it("blocks when over cap", async () => {
      repo.getDailyTokensUsed.mockResolvedValue([{ total: BigInt(FREE_DAILY_TOKEN_CAP + 1) }] as never);
      const result = await consultService.checkDailyTokenCap("user-1");
      expect(result.allowed).toBe(false);
    });
  });

  describe("streamResponse — canned fallback", () => {
    it("uses canned reply when OpenAI is unavailable", async () => {
      repo.findSessionById.mockResolvedValue(mockSession({ userId: "user-1" }) as never);
      repo.createMessage.mockResolvedValue({ id: "m-1" } as never);
      repo.touchSession.mockResolvedValue(undefined as never);
      repo.listMessages.mockResolvedValue([] as never);

      const chunks: string[] = [];
      const result = await consultService.streamResponse(
        "user-1",
        "session-1",
        "What about my position size?",
        (text) => chunks.push(text),
      );

      expect(chunks.length).toBeGreaterThan(0);
      expect(result.metadata.model).toBe("fallback.pickReply");
      expect(repo.createMessage).toHaveBeenCalledTimes(2);
    });

    it("blocks non-owner from streaming", async () => {
      repo.findSessionById.mockResolvedValue(mockSession({ userId: "user-1" }) as never);

      await expect(
        consultService.streamResponse("user-other", "session-1", "hi", vi.fn()),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
