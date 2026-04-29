import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@tradevantage/shared", () => ({
  HASHTAGS: ["macro", "fx", "crypto", "equities"],
}));

vi.mock("./tag.repository.js", () => ({
  tagRepository: {
    listApprovedNewsTags: vi.fn(),
    listPublishedPrimerTags: vi.fn(),
    listNewsByTag: vi.fn(),
  },
}));

import { tagService } from "./tag.service.js";
import { tagRepository } from "./tag.repository.js";

const repo = vi.mocked(tagRepository);

describe("tagService", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("getCounts", () => {
    it("returns all hashtags with zero counts when no data", async () => {
      repo.listApprovedNewsTags.mockResolvedValue([] as never);
      repo.listPublishedPrimerTags.mockResolvedValue([] as never);

      const result = await tagService.getCounts();

      expect(result).toEqual([
        { tag: "macro", newsCount: 0, primerCount: 0, total: 0 },
        { tag: "fx", newsCount: 0, primerCount: 0, total: 0 },
        { tag: "crypto", newsCount: 0, primerCount: 0, total: 0 },
        { tag: "equities", newsCount: 0, primerCount: 0, total: 0 },
      ]);
    });

    it("tallies news tags correctly", async () => {
      repo.listApprovedNewsTags.mockResolvedValue([
        { tags: ["macro", "fx"] },
        { tags: ["macro"] },
        { tags: ["crypto"] },
      ] as never);
      repo.listPublishedPrimerTags.mockResolvedValue([] as never);

      const result = await tagService.getCounts();

      expect(result).toEqual([
        { tag: "macro", newsCount: 2, primerCount: 0, total: 2 },
        { tag: "fx", newsCount: 1, primerCount: 0, total: 1 },
        { tag: "crypto", newsCount: 1, primerCount: 0, total: 1 },
        { tag: "equities", newsCount: 0, primerCount: 0, total: 0 },
      ]);
    });

    it("tallies primer tags correctly", async () => {
      repo.listApprovedNewsTags.mockResolvedValue([] as never);
      repo.listPublishedPrimerTags.mockResolvedValue([
        { tags: ["fx", "equities"] },
        { tags: ["equities"] },
      ] as never);

      const result = await tagService.getCounts();

      expect(result).toEqual([
        { tag: "macro", newsCount: 0, primerCount: 0, total: 0 },
        { tag: "fx", newsCount: 0, primerCount: 1, total: 1 },
        { tag: "crypto", newsCount: 0, primerCount: 0, total: 0 },
        { tag: "equities", newsCount: 0, primerCount: 2, total: 2 },
      ]);
    });

    it("combines news and primer counts in total", async () => {
      repo.listApprovedNewsTags.mockResolvedValue([
        { tags: ["macro"] },
        { tags: ["macro", "fx"] },
      ] as never);
      repo.listPublishedPrimerTags.mockResolvedValue([
        { tags: ["macro"] },
        { tags: ["fx", "crypto"] },
      ] as never);

      const result = await tagService.getCounts();

      const macro = result.find((r) => r.tag === "macro")!;
      expect(macro.newsCount).toBe(2);
      expect(macro.primerCount).toBe(1);
      expect(macro.total).toBe(3);

      const fx = result.find((r) => r.tag === "fx")!;
      expect(fx.newsCount).toBe(1);
      expect(fx.primerCount).toBe(1);
      expect(fx.total).toBe(2);

      const crypto = result.find((r) => r.tag === "crypto")!;
      expect(crypto.newsCount).toBe(0);
      expect(crypto.primerCount).toBe(1);
      expect(crypto.total).toBe(1);
    });

    it("ignores tags not in HASHTAGS set", async () => {
      repo.listApprovedNewsTags.mockResolvedValue([
        { tags: ["macro", "unknown_tag"] },
        { tags: ["nonexistent"] },
      ] as never);
      repo.listPublishedPrimerTags.mockResolvedValue([
        { tags: ["bogus", "fx"] },
      ] as never);

      const result = await tagService.getCounts();

      expect(result).toHaveLength(4);
      expect(result.find((r) => r.tag === "macro")!.newsCount).toBe(1);
      expect(result.find((r) => r.tag === "fx")!.primerCount).toBe(1);
      expect(result.every((r) => ["macro", "fx", "crypto", "equities"].includes(r.tag))).toBe(true);
    });

    it("handles empty arrays from repository", async () => {
      repo.listApprovedNewsTags.mockResolvedValue([] as never);
      repo.listPublishedPrimerTags.mockResolvedValue([] as never);

      const result = await tagService.getCounts();

      expect(result).toHaveLength(4);
      expect(result.every((r) => r.newsCount === 0 && r.primerCount === 0 && r.total === 0)).toBe(true);
      expect(repo.listApprovedNewsTags).toHaveBeenCalledOnce();
      expect(repo.listPublishedPrimerTags).toHaveBeenCalledOnce();
    });
  });

  describe("listNewsByTag", () => {
    it("delegates to repository", async () => {
      const items = [{ id: "n1", headline: "Test", tags: ["macro"] }];
      repo.listNewsByTag.mockResolvedValue(items as never);

      const result = await tagService.listNewsByTag("macro", 50);

      expect(result).toEqual(items);
      expect(repo.listNewsByTag).toHaveBeenCalledWith("macro", 50);
    });
  });
});
