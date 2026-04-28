import { describe, it, expect, vi, beforeEach } from "vitest";

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

vi.mock("@/config/database.js", () => ({
  prisma: {
    newsItem: {
      findMany: vi.fn(),
    },
  },
}));

import { searchRepository } from "./search.repository.js";
import { prisma } from "@/config/database.js";

const mockFindMany = vi.mocked(prisma.newsItem.findMany);

/* ------------------------------------------------------------------ */
/*  Factories                                                          */
/* ------------------------------------------------------------------ */

function makeNewsItem(overrides: Partial<{
  id: string;
  sourceCode: string;
  headline: string;
  analysis: string;
  impact: string;
  bias: string;
  affects: string[];
  tags: string[];
  author: string;
  publishedAt: Date;
  fetchedAt: Date;
  relatedPlanIds: string[];
}> = {}) {
  return {
    id: overrides.id ?? "news-001",
    sourceCode: overrides.sourceCode ?? "FRED",
    headline: overrides.headline ?? "Test headline about markets",
    analysis: overrides.analysis ?? "Analysis of market conditions",
    impact: overrides.impact ?? "high",
    bias: overrides.bias ?? "bullish",
    affects: overrides.affects ?? ["equities"],
    tags: overrides.tags ?? ["macro"],
    author: overrides.author ?? "FRED",
    publishedAt: overrides.publishedAt ?? new Date("2025-01-15T10:00:00Z"),
    fetchedAt: overrides.fetchedAt ?? new Date("2025-01-15T10:05:00Z"),
    relatedPlanIds: overrides.relatedPlanIds ?? [],
  };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("searchRepository.searchApprovedNews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries with correct where clause (status approved, OR on headline/analysis/author)", async () => {
    mockFindMany.mockResolvedValue([]);

    await searchRepository.searchApprovedNews("gold", 20);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "approved",
          OR: [
            { headline: { contains: "gold", mode: "insensitive" } },
            { analysis: { contains: "gold", mode: "insensitive" } },
            { author: { contains: "gold", mode: "insensitive" } },
          ],
        },
      }),
    );
  });

  it("respects limit parameter via take", async () => {
    mockFindMany.mockResolvedValue([]);

    await searchRepository.searchApprovedNews("oil", 5);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
      }),
    );
  });

  it("passes a different limit correctly", async () => {
    mockFindMany.mockResolvedValue([]);

    await searchRepository.searchApprovedNews("bonds", 50);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
      }),
    );
  });

  it("returns empty array when no matches", async () => {
    mockFindMany.mockResolvedValue([]);

    const results = await searchRepository.searchApprovedNews("nonexistent-term-xyz", 20);

    expect(results).toEqual([]);
  });

  it("returns matching news items", async () => {
    const items = [
      makeNewsItem({ id: "n-1", headline: "Gold rallies" }),
      makeNewsItem({ id: "n-2", headline: "Gold drops" }),
    ];
    mockFindMany.mockResolvedValue(items as never);

    const results = await searchRepository.searchApprovedNews("gold", 20);

    expect(results).toHaveLength(2);
    expect(results[0]!.id).toBe("n-1");
    expect(results[1]!.id).toBe("n-2");
  });

  it("uses case-insensitive search mode", async () => {
    mockFindMany.mockResolvedValue([]);

    await searchRepository.searchApprovedNews("GOLD", 20);

    const call = mockFindMany.mock.calls[0]![0];
    const orClauses = call?.where?.OR as Array<Record<string, { mode: string }>>;

    for (const clause of orClauses) {
      const field = Object.keys(clause)[0]!;
      expect(clause[field]!.mode).toBe("insensitive");
    }
  });

  it("orders results by publishedAt descending", async () => {
    mockFindMany.mockResolvedValue([]);

    await searchRepository.searchApprovedNews("forex", 10);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { publishedAt: "desc" },
      }),
    );
  });

  it("selects only the expected fields", async () => {
    mockFindMany.mockResolvedValue([]);

    await searchRepository.searchApprovedNews("test", 10);

    const call = mockFindMany.mock.calls[0]![0];
    expect(call?.select).toEqual(
      expect.objectContaining({
        id: true,
        sourceCode: true,
        headline: true,
        analysis: true,
        impact: true,
        bias: true,
        affects: true,
        tags: true,
        author: true,
        publishedAt: true,
        fetchedAt: true,
        relatedPlanIds: true,
      }),
    );
  });
});
