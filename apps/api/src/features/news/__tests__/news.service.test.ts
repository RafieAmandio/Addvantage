import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, ForbiddenError } from "@/core/errors/index.js";

vi.mock("../news.repository.js", () => ({
  newsRepository: {
    findApproved: vi.fn(),
    countApproved: vi.fn(),
    findApprovedById: vi.fn(),
    findPending: vi.fn(),
    countPending: vi.fn(),
    findRejected: vi.fn(),
    countRejected: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    updateDraft: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
  },
}));

import { newsService } from "../news.service.js";
import { newsRepository } from "../news.repository.js";

const repo = vi.mocked(newsRepository);

const mockNewsItem = (overrides: Partial<{ id: string; status: string }> = {}) => ({
  id: overrides.id ?? "news-1",
  sourceCode: "FRED",
  headline: "Test headline",
  rephrased: "Test rephrased",
  analysis: "Test analysis",
  impact: "high",
  bias: "neutral",
  affects: ["DXY"],
  tags: ["macro"],
  author: "FRED",
  status: overrides.status ?? "pending",
  publishedAt: null,
  fetchedAt: new Date().toISOString(),
  contentHash: "abc123",
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("newsService", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("getApproved", () => {
    it("returns item when found", async () => {
      const item = mockNewsItem({ status: "approved" });
      repo.findApprovedById.mockResolvedValue(item as never);
      const result = await newsService.getApproved("news-1");
      expect(result).toEqual(item);
    });

    it("throws NotFoundError when item does not exist", async () => {
      repo.findApprovedById.mockResolvedValue(null as never);
      await expect(newsService.getApproved("missing")).rejects.toThrow(NotFoundError);
    });
  });

  describe("approve", () => {
    it("approves a pending item", async () => {
      const item = mockNewsItem({ id: "n-1", status: "pending" });
      repo.findById.mockResolvedValue(item as never);
      repo.approve.mockResolvedValue(item as never);

      await newsService.approve("n-1", "reviewer-1");
      expect(repo.approve).toHaveBeenCalledWith("n-1", "reviewer-1");
    });

    it("rejects approve on non-pending item", async () => {
      const item = mockNewsItem({ status: "approved" });
      repo.findById.mockResolvedValue(item as never);
      await expect(newsService.approve("n-1", "r-1")).rejects.toThrow(ForbiddenError);
    });

    it("throws NotFoundError when item missing", async () => {
      repo.findById.mockResolvedValue(null as never);
      await expect(newsService.approve("missing", "r-1")).rejects.toThrow(NotFoundError);
    });
  });

  describe("reject", () => {
    it("rejects a pending item", async () => {
      const item = mockNewsItem({ id: "n-2", status: "pending" });
      repo.findById.mockResolvedValue(item as never);
      repo.reject.mockResolvedValue(item as never);

      await newsService.reject("n-2", "reviewer-1");
      expect(repo.reject).toHaveBeenCalledWith("n-2", "reviewer-1");
    });

    it("rejects reject on already-approved item", async () => {
      const item = mockNewsItem({ status: "approved" });
      repo.findById.mockResolvedValue(item as never);
      await expect(newsService.reject("n-2", "r-1")).rejects.toThrow(ForbiddenError);
    });
  });

  describe("create", () => {
    it("generates content hash from sourceCode + manual + headline", async () => {
      repo.create.mockImplementation((data: Record<string, unknown>) => {
        expect(data.contentHash).toBeDefined();
        expect(typeof data.contentHash).toBe("string");
        expect((data.contentHash as string).length).toBe(64);
        return data as never;
      });

      await newsService.create({
        headline: "Test headline",
        rephrased: "Rephrased",
        analysis: "Analysis",
        impact: "high",
        bias: "neutral",
        affects: [],
        tags: [],
        author: "FRED",
        sourceCode: "FRED",
        sourceUrl: null,
        rawText: null,
      });

      expect(repo.create).toHaveBeenCalledTimes(1);
    });

    it("produces deterministic hash for same inputs", async () => {
      const hashes: string[] = [];
      repo.create.mockImplementation((data: Record<string, unknown>) => {
        hashes.push(data.contentHash as string);
        return data as never;
      });

      const input = {
        headline: "Same headline",
        rephrased: "R",
        analysis: "A",
        impact: "low",
        bias: "neutral",
        affects: [],
        tags: [],
        author: "SC",
        sourceCode: "SC",
        sourceUrl: null,
        rawText: null,
      };

      await newsService.create(input);
      await newsService.create(input);

      expect(hashes[0]).toBe(hashes[1]);
    });
  });

  describe("listApproved", () => {
    it("returns paginated result", async () => {
      const items = [mockNewsItem()];
      repo.findApproved.mockResolvedValue(items as never);
      repo.countApproved.mockResolvedValue(1 as never);

      const result = await newsService.listApproved({ page: 1, limit: 20, skip: 0 });
      expect(result.content).toEqual(items);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });
});
