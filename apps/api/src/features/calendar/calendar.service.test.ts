import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError } from "@/core/errors/index.js";

vi.mock("./calendar.repository.js", () => ({
  calendarRepository: {
    listEvents: vi.fn(),
    findEventById: vi.fn(),
    listCorrelatedNews: vi.fn(),
  },
}));

import { calendarService } from "./calendar.service.js";
import { calendarRepository } from "./calendar.repository.js";

const repo = vi.mocked(calendarRepository);

const mockEvent = (overrides: Partial<{
  id: string;
  symbols: string[];
  occurredAt: Date;
}> = {}) => ({
  id: overrides.id ?? "evt-1",
  kind: "economic",
  sourceCode: "FRED",
  occurredAt: overrides.occurredAt ?? new Date("2025-06-15T12:00:00Z"),
  symbols: overrides.symbols ?? ["DXY", "XAUUSD"],
  title: "CPI Release",
  body: "Inflation data",
  url: "https://example.com",
  bias: "neutral",
  impact: "high",
  newsItemId: null,
});

const mockNewsItem = () => ({
  id: "news-1",
  sourceCode: "FRED",
  headline: "Gold reacts to CPI",
  impact: "high",
  bias: "neutral",
  affects: ["XAUUSD"],
  publishedAt: new Date("2025-06-15T12:30:00Z"),
});

describe("calendarService", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("listEvents", () => {
    it("returns events with default date range", async () => {
      const events = [mockEvent()];
      repo.listEvents.mockResolvedValue(events as never);

      const result = await calendarService.listEvents({});

      expect(repo.listEvents).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 200 }),
      );
      expect(result.events).toEqual(events);
      expect(result.from).toBeDefined();
      expect(result.to).toBeDefined();
    });

    it("returns empty when symbols is empty array", async () => {
      const result = await calendarService.listEvents({ symbols: [] });

      expect(result.events).toEqual([]);
      expect(repo.listEvents).not.toHaveBeenCalled();
    });

    it("returns empty when kinds is empty array", async () => {
      const result = await calendarService.listEvents({ kinds: [] });

      expect(result.events).toEqual([]);
      expect(repo.listEvents).not.toHaveBeenCalled();
    });

    it("passes through custom from/to/limit", async () => {
      const from = new Date("2025-01-01T00:00:00Z");
      const to = new Date("2025-01-31T23:59:59Z");
      repo.listEvents.mockResolvedValue([] as never);

      await calendarService.listEvents({
        from,
        to,
        limit: 50,
        symbols: ["XAUUSD"],
        kinds: ["economic"],
      });

      expect(repo.listEvents).toHaveBeenCalledWith({
        symbols: ["XAUUSD"],
        kinds: ["economic"],
        from,
        to,
        limit: 50,
      });
    });
  });

  describe("getCorrelatedNews", () => {
    it("throws NotFoundError for missing event", async () => {
      repo.findEventById.mockResolvedValue(null as never);

      await expect(
        calendarService.getCorrelatedNews("missing"),
      ).rejects.toThrow(NotFoundError);
    });

    it("returns empty for event with no symbols", async () => {
      const event = mockEvent({ symbols: [] });
      repo.findEventById.mockResolvedValue(event as never);

      const result = await calendarService.getCorrelatedNews("evt-1");

      expect(result).toEqual([]);
      expect(repo.listCorrelatedNews).not.toHaveBeenCalled();
    });

    it("fetches correlated news within 2hr window", async () => {
      const event = mockEvent();
      const news = [mockNewsItem()];
      repo.findEventById.mockResolvedValue(event as never);
      repo.listCorrelatedNews.mockResolvedValue(news as never);

      const result = await calendarService.getCorrelatedNews("evt-1");

      expect(result).toEqual(news);
      expect(repo.listCorrelatedNews).toHaveBeenCalledWith(
        event.symbols,
        expect.any(Date),
        expect.any(Date),
        20,
      );
    });

    it("passes correct from/to dates (+/-2 hours from occurredAt)", async () => {
      const occurredAt = new Date("2025-06-15T12:00:00Z");
      const event = mockEvent({ occurredAt });
      repo.findEventById.mockResolvedValue(event as never);
      repo.listCorrelatedNews.mockResolvedValue([] as never);

      await calendarService.getCorrelatedNews("evt-1");

      const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
      const expectedFrom = new Date(occurredAt.getTime() - TWO_HOURS_MS);
      const expectedTo = new Date(occurredAt.getTime() + TWO_HOURS_MS);

      expect(repo.listCorrelatedNews).toHaveBeenCalledWith(
        event.symbols,
        expectedFrom,
        expectedTo,
        20,
      );
    });
  });
});
