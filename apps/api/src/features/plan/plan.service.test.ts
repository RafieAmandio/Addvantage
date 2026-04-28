import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, ForbiddenError } from "@/core/errors/index.js";

vi.mock("./plan.repository.js", () => ({
  planRepository: {
    findById: vi.fn(),
    findPublished: vi.fn(),
    countPublished: vi.fn(),
    findAllForAdmin: vi.fn(),
    countAll: vi.fn(),
    findMyDrafts: vi.fn(),
    countMyDrafts: vi.fn(),
    findClosedWithR: vi.fn(),
    getNewsForPlan: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { planService } from "./plan.service.js";
import { planRepository } from "./plan.repository.js";

const repo = vi.mocked(planRepository);

const mockPlan = (overrides: Partial<{
  id: string;
  status: string;
  direction: string;
  entry: number | null;
  stop: number | null;
  outcome: string | null;
  realizedR: number | null;
}> = {}) => ({
  id: overrides.id ?? "plan-1",
  symbol: "XAUUSD",
  thesis: "Gold going up",
  direction: overrides.direction ?? "long",
  entry: overrides.entry ?? 2000,
  stop: overrides.stop ?? 1980,
  target: 2040,
  rMultiple: 2,
  setups: [],
  tags: ["commodity"],
  tier: "free",
  status: overrides.status ?? "draft",
  authorId: "admin-1",
  publishedAt: null,
  closedAt: null,
  outcome: overrides.outcome ?? null,
  closePrice: null,
  realizedR: overrides.realizedR ?? null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("planService", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("publish", () => {
    it("publishes a draft plan", async () => {
      const plan = mockPlan({ status: "draft" });
      repo.findById.mockResolvedValue(plan as never);
      repo.update.mockResolvedValue({ ...plan, status: "published" } as never);

      await planService.publish("plan-1");
      expect(repo.update).toHaveBeenCalledWith("plan-1", expect.objectContaining({
        status: "published",
      }));
    });

    it("rejects publishing a non-draft plan", async () => {
      repo.findById.mockResolvedValue(mockPlan({ status: "published" }) as never);
      await expect(planService.publish("plan-1")).rejects.toThrow(ForbiddenError);
    });

    it("throws NotFoundError for missing plan", async () => {
      repo.findById.mockResolvedValue(null as never);
      await expect(planService.publish("missing")).rejects.toThrow(NotFoundError);
    });
  });

  describe("close", () => {
    it("closes a published plan with realized R", async () => {
      const plan = mockPlan({
        status: "published",
        direction: "long",
        entry: 100,
        stop: 90,
      });
      repo.findById.mockResolvedValue(plan as never);
      repo.update.mockImplementation((_id, data) => ({ ...plan, ...data }) as never);

      await planService.close("plan-1", { outcome: "win", closePrice: 120 });

      expect(repo.update).toHaveBeenCalledWith("plan-1", expect.objectContaining({
        status: "closed",
        outcome: "win",
        closePrice: 120,
        realizedR: 2,
      }));
    });

    it("computes negative R for losing long trade", async () => {
      const plan = mockPlan({
        status: "published",
        direction: "long",
        entry: 100,
        stop: 90,
      });
      repo.findById.mockResolvedValue(plan as never);
      repo.update.mockImplementation((_id, data) => ({ ...plan, ...data }) as never);

      await planService.close("plan-1", { outcome: "loss", closePrice: 85 });

      expect(repo.update).toHaveBeenCalledWith("plan-1", expect.objectContaining({
        realizedR: -1.5,
      }));
    });

    it("computes R for short trade", async () => {
      const plan = mockPlan({
        status: "published",
        direction: "short",
        entry: 100,
        stop: 110,
      });
      repo.findById.mockResolvedValue(plan as never);
      repo.update.mockImplementation((_id, data) => ({ ...plan, ...data }) as never);

      await planService.close("plan-1", { outcome: "win", closePrice: 80 });

      expect(repo.update).toHaveBeenCalledWith("plan-1", expect.objectContaining({
        realizedR: 2,
      }));
    });

    it("returns null R when entry equals stop", async () => {
      const plan = mockPlan({
        status: "published",
        direction: "long",
        entry: 100,
        stop: 100,
      });
      repo.findById.mockResolvedValue(plan as never);
      repo.update.mockImplementation((_id, data) => ({ ...plan, ...data }) as never);

      await planService.close("plan-1", { outcome: "loss", closePrice: 95 });

      expect(repo.update).toHaveBeenCalledWith("plan-1", expect.objectContaining({
        realizedR: null,
      }));
    });

    it("returns null R when close price is null", async () => {
      const plan = mockPlan({
        status: "published",
        direction: "long",
        entry: 100,
        stop: 90,
      });
      repo.findById.mockResolvedValue(plan as never);
      repo.update.mockImplementation((_id, data) => ({ ...plan, ...data }) as never);

      await planService.close("plan-1", { outcome: "loss", closePrice: null });

      expect(repo.update).toHaveBeenCalledWith("plan-1", expect.objectContaining({
        realizedR: null,
      }));
    });

    it("rejects closing a non-published plan", async () => {
      repo.findById.mockResolvedValue(mockPlan({ status: "draft" }) as never);
      await expect(
        planService.close("plan-1", { outcome: "win", closePrice: 120 }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("getPublished", () => {
    it("returns published plan", async () => {
      const plan = mockPlan({ status: "published" });
      repo.findById.mockResolvedValue(plan as never);
      const result = await planService.getPublished("plan-1");
      expect(result).toEqual(plan);
    });

    it("hides non-published plans", async () => {
      repo.findById.mockResolvedValue(mockPlan({ status: "draft" }) as never);
      await expect(planService.getPublished("plan-1")).rejects.toThrow(NotFoundError);
    });
  });

  describe("getStats", () => {
    it("returns empty stats when no closed plans", async () => {
      repo.findClosedWithR.mockResolvedValue([] as never);
      const stats = await planService.getStats();
      expect(stats.n).toBe(0);
      expect(stats.winRate).toBeNull();
      expect(stats.avgR).toBeNull();
    });

    it("computes win rate and avg R", async () => {
      const rows = [
        { direction: "long", outcome: "win", realizedR: 2 },
        { direction: "long", outcome: "loss", realizedR: -1 },
        { direction: "short", outcome: "win", realizedR: 1.5 },
      ];
      repo.findClosedWithR.mockResolvedValue(rows as never);

      const stats = await planService.getStats();
      expect(stats.n).toBe(3);
      expect(stats.winRate).toBeCloseTo(2 / 3);
      expect(stats.avgR).toBeCloseTo((2 + -1 + 1.5) / 3);
      expect(stats.byDirection.long.n).toBe(2);
      expect(stats.byDirection.short.n).toBe(1);
    });
  });

  describe("remove", () => {
    it("removes existing plan", async () => {
      repo.findById.mockResolvedValue(mockPlan() as never);
      repo.remove.mockResolvedValue(undefined as never);
      await planService.remove("plan-1");
      expect(repo.remove).toHaveBeenCalledWith("plan-1");
    });

    it("throws NotFoundError for missing plan", async () => {
      repo.findById.mockResolvedValue(null as never);
      await expect(planService.remove("missing")).rejects.toThrow(NotFoundError);
    });
  });
});
