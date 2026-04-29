import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockIngestionRunFindMany, mockSourceFindMany } = vi.hoisted(() => ({
  mockIngestionRunFindMany: vi.fn(),
  mockSourceFindMany: vi.fn(),
}));

vi.mock("@/config/database.js", () => ({
  prisma: {
    ingestionRun: { findMany: mockIngestionRunFindMany },
    source: { findMany: mockSourceFindMany },
  },
}));

import { ingestionRepository } from "../ingestion.repository.js";

function mockRun(overrides: Record<string, unknown> = {}) {
  return {
    id: "run-1",
    sourceCode: "FRED",
    startedAt: new Date("2025-06-15T10:00:00Z"),
    finishedAt: new Date("2025-06-15T10:00:05Z"),
    status: "ok",
    itemsFetched: 10,
    itemsNew: 3,
    itemsRephrased: 3,
    error: null,
    ...overrides,
  };
}

describe("ingestionRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listRuns", () => {
    it("returns runs ordered by startedAt desc", async () => {
      const runs = [mockRun(), mockRun({ id: "run-2", sourceCode: "SC" })];
      mockIngestionRunFindMany.mockResolvedValue(runs);

      const result = await ingestionRepository.listRuns(100);

      expect(result).toHaveLength(2);
      expect(mockIngestionRunFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { startedAt: "desc" },
          take: 100,
        }),
      );
    });

    it("respects limit parameter", async () => {
      mockIngestionRunFindMany.mockResolvedValue([]);

      await ingestionRepository.listRuns(25);

      expect(mockIngestionRunFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 25 }),
      );
    });

    it("returns empty array when no runs", async () => {
      mockIngestionRunFindMany.mockResolvedValue([]);

      const result = await ingestionRepository.listRuns(100);

      expect(result).toEqual([]);
    });
  });

  describe("listSources", () => {
    it("returns sources ordered by code", async () => {
      const sources = [
        { code: "FRED", name: "Federal Reserve" },
        { code: "SC", name: "Seeking Alpha" },
      ];
      mockSourceFindMany.mockResolvedValue(sources);

      const result = await ingestionRepository.listSources();

      expect(result).toHaveLength(2);
      expect(mockSourceFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { code: "asc" },
        }),
      );
    });
  });
});
