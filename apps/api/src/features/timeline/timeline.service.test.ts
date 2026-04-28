import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError } from "@/core/errors/index.js";

vi.mock("./timeline.repository.js", () => ({
  timelineRepository: {
    list: vi.fn(),
    findById: vi.fn(),
    createPin: vi.fn(),
  },
}));

import { timelineService } from "./timeline.service.js";
import { timelineRepository } from "./timeline.repository.js";

const repo = vi.mocked(timelineRepository);

const mockEvent = (overrides: Partial<{
  id: string;
  kind: string;
  symbols: string[];
}> = {}) => ({
  id: overrides.id ?? "evt-1",
  kind: overrides.kind ?? "news",
  sourceCode: "FRED",
  occurredAt: new Date("2025-01-15T10:00:00Z"),
  symbols: overrides.symbols ?? ["XAUUSD"],
  title: "Gold surges on rate cut",
  body: "Analysis body",
  url: null,
  bias: "bullish",
  impact: "high",
  newsItemId: null,
});

describe("timelineService", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("list", () => {
    it("returns events with default limit", async () => {
      const events = [mockEvent()];
      repo.list.mockResolvedValue(events as never);

      const result = await timelineService.list({});

      expect(result).toEqual(events);
      expect(repo.list).toHaveBeenCalledWith({
        symbols: undefined,
        kinds: undefined,
        from: undefined,
        to: undefined,
        limit: 200,
      });
    });

    it("returns empty when symbols is empty array", async () => {
      const result = await timelineService.list({ symbols: [] });

      expect(result).toEqual([]);
      expect(repo.list).not.toHaveBeenCalled();
    });

    it("returns empty when kinds is empty array", async () => {
      const result = await timelineService.list({ kinds: [] });

      expect(result).toEqual([]);
      expect(repo.list).not.toHaveBeenCalled();
    });

    it("passes through symbols/kinds/from/to/limit", async () => {
      repo.list.mockResolvedValue([] as never);

      await timelineService.list({
        symbols: ["XAUUSD", "DXY"],
        kinds: ["news", "user_pin"],
        from: "2025-01-01",
        to: "2025-01-31",
        limit: 50,
      });

      expect(repo.list).toHaveBeenCalledWith({
        symbols: ["XAUUSD", "DXY"],
        kinds: ["news", "user_pin"],
        from: "2025-01-01",
        to: "2025-01-31",
        limit: 50,
      });
    });
  });

  describe("getById", () => {
    it("returns event when found", async () => {
      const event = mockEvent({ id: "evt-42" });
      repo.findById.mockResolvedValue(event as never);

      const result = await timelineService.getById("evt-42");

      expect(result).toEqual(event);
      expect(repo.findById).toHaveBeenCalledWith("evt-42");
    });

    it("throws NotFoundError when not found", async () => {
      repo.findById.mockResolvedValue(null as never);

      await expect(timelineService.getById("missing")).rejects.toThrow(NotFoundError);
      await expect(timelineService.getById("missing")).rejects.toThrow("Timeline event not found");
    });
  });

  describe("createPin", () => {
    it("uppercases symbol", async () => {
      repo.createPin.mockResolvedValue({ id: "pin-1" } as never);

      await timelineService.createPin("user-1", {
        title: "My pin",
        symbol: "xauusd",
        occurredAt: "2025-03-01T12:00:00Z",
      });

      expect(repo.createPin).toHaveBeenCalledWith(
        expect.objectContaining({ symbols: ["XAUUSD"] }),
      );
    });

    it("wraps single symbol in array", async () => {
      repo.createPin.mockResolvedValue({ id: "pin-1" } as never);

      await timelineService.createPin("user-1", {
        title: "My pin",
        symbol: "DXY",
        occurredAt: "2025-03-01T12:00:00Z",
      });

      expect(repo.createPin).toHaveBeenCalledWith(
        expect.objectContaining({ symbols: ["DXY"] }),
      );
      const call = repo.createPin.mock.calls[0]![0];
      expect(Array.isArray(call.symbols)).toBe(true);
      expect(call.symbols).toHaveLength(1);
    });

    it("passes null body when not provided", async () => {
      repo.createPin.mockResolvedValue({ id: "pin-1" } as never);

      await timelineService.createPin("user-1", {
        title: "No body pin",
        symbol: "EURUSD",
        occurredAt: "2025-03-01T12:00:00Z",
      });

      expect(repo.createPin).toHaveBeenCalledWith(
        expect.objectContaining({ body: null }),
      );
    });

    it("converts occurredAt string to Date", async () => {
      repo.createPin.mockResolvedValue({ id: "pin-1" } as never);

      const dateStr = "2025-06-15T09:30:00Z";
      await timelineService.createPin("user-1", {
        title: "Date pin",
        symbol: "SPX",
        occurredAt: dateStr,
      });

      const call = repo.createPin.mock.calls[0]![0];
      expect(call.occurredAt).toBeInstanceOf(Date);
      expect(call.occurredAt.getTime()).toBe(new Date(dateStr).getTime());
    });

    it("passes createdBy as userId", async () => {
      repo.createPin.mockResolvedValue({ id: "pin-1" } as never);

      await timelineService.createPin("user-abc", {
        title: "User pin",
        body: "Some notes",
        symbol: "BTC",
        occurredAt: "2025-03-01T12:00:00Z",
      });

      expect(repo.createPin).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: "user-abc",
          title: "User pin",
          body: "Some notes",
        }),
      );
    });
  });
});
