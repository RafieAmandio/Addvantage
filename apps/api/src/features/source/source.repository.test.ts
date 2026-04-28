import { describe, it, expect, vi, beforeEach } from "vitest";

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

vi.mock("@/config/database.js", () => ({
  prisma: {
    source: {
      findMany: vi.fn(),
    },
  },
}));

import { sourceRepository } from "./source.repository.js";
import { prisma } from "@/config/database.js";

const mockFindMany = vi.mocked(prisma.source.findMany);

/* ------------------------------------------------------------------ */
/*  Factories                                                          */
/* ------------------------------------------------------------------ */

function makeSource(overrides: Partial<{
  code: string;
  name: string;
  url: string;
  enabled: boolean;
  pollMinutes: number;
  lastPolledAt: Date | null;
  lastSuccessAt: Date | null;
  lastError: string | null;
}> = {}) {
  return {
    code: overrides.code ?? "FRED",
    name: overrides.name ?? "Federal Reserve Economic Data",
    url: overrides.url ?? "https://fred.stlouisfed.org",
    enabled: overrides.enabled ?? true,
    pollMinutes: overrides.pollMinutes ?? 60,
    lastPolledAt: overrides.lastPolledAt ?? new Date("2025-01-15T09:00:00Z"),
    lastSuccessAt: overrides.lastSuccessAt ?? new Date("2025-01-15T09:00:00Z"),
    lastError: overrides.lastError ?? null,
  };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("sourceRepository.findAll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all sources ordered by code", async () => {
    const sources = [
      makeSource({ code: "FRED", name: "Federal Reserve" }),
      makeSource({ code: "SC", name: "S&P Capital IQ" }),
      makeSource({ code: "SPDJI", name: "S&P Dow Jones Indices" }),
    ];
    mockFindMany.mockResolvedValue(sources as never);

    const result = await sourceRepository.findAll();

    expect(result).toEqual(sources);
    expect(result).toHaveLength(3);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { code: "asc" },
      }),
    );
  });

  it("selects the correct fields", async () => {
    mockFindMany.mockResolvedValue([] as never);

    await sourceRepository.findAll();

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          code: true,
          name: true,
          url: true,
          enabled: true,
          pollMinutes: true,
          lastPolledAt: true,
          lastSuccessAt: true,
          lastError: true,
        },
      }),
    );
  });

  it("returns empty array when no sources exist", async () => {
    mockFindMany.mockResolvedValue([] as never);

    const result = await sourceRepository.findAll();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it("includes disabled sources in results", async () => {
    const sources = [
      makeSource({ code: "FRED", enabled: true }),
      makeSource({ code: "RBC", enabled: false }),
    ];
    mockFindMany.mockResolvedValue(sources as never);

    const result = await sourceRepository.findAll();

    expect(result).toHaveLength(2);
    // findAll does not filter by enabled — it returns everything
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.not.objectContaining({
        where: expect.anything(),
      }),
    );
  });

  it("includes sources with errors", async () => {
    const sources = [
      makeSource({ code: "FRED", lastError: null }),
      makeSource({ code: "SC", lastError: "Timeout after 30s" }),
    ];
    mockFindMany.mockResolvedValue(sources as never);

    const result = await sourceRepository.findAll();

    expect(result).toHaveLength(2);
    expect(result[1]!.lastError).toBe("Timeout after 30s");
  });
});
