import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../chart.repository.js", () => ({
  chartRepository: {
    listBars: vi.fn(),
  },
}));

import { chartService } from "../chart.service.js";
import { chartRepository } from "../chart.repository.js";

const repo = vi.mocked(chartRepository);

const mockBarRow = (overrides: Partial<{
  ts: Date;
  open: unknown;
  high: unknown;
  low: unknown;
  close: unknown;
  volume: unknown;
}> = {}) => ({
  ts: "ts" in overrides ? overrides.ts : new Date("2025-06-15T12:00:00Z"),
  open: "open" in overrides ? overrides.open : { toNumber: () => 2000, toString: () => "2000" },
  high: "high" in overrides ? overrides.high : { toNumber: () => 2050, toString: () => "2050" },
  low: "low" in overrides ? overrides.low : { toNumber: () => 1990, toString: () => "1990" },
  close: "close" in overrides ? overrides.close : { toNumber: () => 2040, toString: () => "2040" },
  volume: "volume" in overrides ? overrides.volume : { toNumber: () => 15000, toString: () => "15000" },
});

describe("chartService", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("listBars", () => {
    it("returns bars with default date range", async () => {
      const rows = [mockBarRow()];
      repo.listBars.mockResolvedValue(rows as never);

      const result = await chartService.listBars({
        symbol: "XAUUSD",
        interval: "1h",
      });

      expect(repo.listBars).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: "XAUUSD",
          interval: "1h",
          limit: 5000,
        }),
      );
      expect(result.symbol).toBe("XAUUSD");
      expect(result.interval).toBe("1h");
      expect(result.from).toBeDefined();
      expect(result.to).toBeDefined();
      expect(result.bars).toHaveLength(1);
    });

    it("applies custom from/to/limit", async () => {
      const from = new Date("2025-01-01T00:00:00Z");
      const to = new Date("2025-01-31T23:59:59Z");
      repo.listBars.mockResolvedValue([] as never);

      await chartService.listBars({
        symbol: "EURUSD",
        interval: "4h",
        from,
        to,
        limit: 100,
      });

      expect(repo.listBars).toHaveBeenCalledWith({
        symbol: "EURUSD",
        interval: "4h",
        from,
        to,
        limit: 100,
      });
    });

    it("converts decimal fields to numbers", async () => {
      const rows = [mockBarRow()];
      repo.listBars.mockResolvedValue(rows as never);

      const result = await chartService.listBars({
        symbol: "XAUUSD",
        interval: "1h",
      });

      const bar = result.bars[0]!;
      expect(bar.ts).toBe("2025-06-15T12:00:00.000Z");
      expect(bar.open).toBe(2000);
      expect(bar.high).toBe(2050);
      expect(bar.low).toBe(1990);
      expect(bar.close).toBe(2040);
      expect(bar.volume).toBe(15000);
      expect(typeof bar.open).toBe("number");
      expect(typeof bar.high).toBe("number");
      expect(typeof bar.low).toBe("number");
      expect(typeof bar.close).toBe("number");
      expect(typeof bar.volume).toBe("number");
    });

    it("handles null volume", async () => {
      const rows = [mockBarRow({ volume: null })];
      repo.listBars.mockResolvedValue(rows as never);

      const result = await chartService.listBars({
        symbol: "XAUUSD",
        interval: "1h",
      });

      expect(result.bars[0]!.volume).toBeNull();
    });

    it("returns empty bars array when no data", async () => {
      repo.listBars.mockResolvedValue([] as never);

      const result = await chartService.listBars({
        symbol: "XAUUSD",
        interval: "1d",
      });

      expect(result.bars).toEqual([]);
      expect(result.symbol).toBe("XAUUSD");
      expect(result.interval).toBe("1d");
    });
  });
});
