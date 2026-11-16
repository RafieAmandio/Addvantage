import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenError } from "@/core/errors/index.js";

vi.mock("../reports.repository.js", () => ({
  reportsRepository: {
    listPublished: vi.fn(),
    getProfileAccess: vi.fn(),
  },
}));

import { reportsService } from "../reports.service.js";
import { reportsRepository } from "../reports.repository.js";

const repo = vi.mocked(reportsRepository);

describe("reportsService.listPublished", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.listPublished.mockResolvedValue([] as never);
  });

  it.each([
    ["free user", { tier: "free", isAdmin: false }],
    ["crypto user", { tier: "crypto", isAdmin: false }],
    ["missing profile", null],
  ])("rejects a %s", async (_label, profile) => {
    repo.getProfileAccess.mockResolvedValue(profile as never);
    await expect(reportsService.listPublished("u1")).rejects.toBeInstanceOf(ForbiddenError);
    expect(repo.listPublished).not.toHaveBeenCalled();
  });

  it("lets vip and admin through", async () => {
    repo.getProfileAccess.mockResolvedValue({ tier: "vip", isAdmin: false } as never);
    await reportsService.listPublished("u1");
    repo.getProfileAccess.mockResolvedValue({ tier: "free", isAdmin: true } as never);
    await reportsService.listPublished("u1");
    expect(repo.listPublished).toHaveBeenCalledTimes(2);
  });

  it("defaults and clamps the limit", async () => {
    repo.getProfileAccess.mockResolvedValue({ tier: "vip", isAdmin: false } as never);
    await reportsService.listPublished("u1");
    await reportsService.listPublished("u1", 5000);
    await reportsService.listPublished("u1", Number("abc"));
    expect(repo.listPublished.mock.calls.map((c) => c[0])).toEqual([100, 200, 100]);
  });
});
