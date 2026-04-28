import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError } from "@/core/errors/index.js";

vi.mock("./user.repository.js", () => ({
  userRepository: {
    findById: vi.fn(),
    findMe: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

import { userService } from "./user.service.js";
import { userRepository } from "./user.repository.js";

const repo = vi.mocked(userRepository);

const mockProfile = (overrides: Partial<{
  id: string;
  tier: string;
  isAdmin: boolean;
}> = {}) => ({
  id: overrides.id ?? "user-1",
  email: "test@example.com",
  handle: "trader1",
  tier: overrides.tier ?? "free",
  isAdmin: overrides.isAdmin ?? false,
  signedLiability: true,
  joinedAt: new Date(),
  renewsAt: null,
  package: null,
  tradingLength: "1-3y",
  longestProfitable: "1m",
  markets: ["fx"],
  yearlyGoal: "50%",
  faultAttribution: "discipline",
});

const mockMeProfile = (overrides: Partial<{
  id: string;
  tier: string;
  isAdmin: boolean;
}> = {}) => ({
  id: overrides.id ?? "user-1",
  email: "test@example.com",
  handle: "trader1",
  tier: overrides.tier ?? "free",
  isAdmin: overrides.isAdmin ?? false,
  signedLiability: true,
});

describe("userService", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("getMe", () => {
    it("returns profile when found", async () => {
      const profile = mockMeProfile({ id: "user-42" });
      repo.findMe.mockResolvedValue(profile as never);

      const result = await userService.getMe("user-42");

      expect(result).toEqual(profile);
      expect(repo.findMe).toHaveBeenCalledWith("user-42");
    });

    it("throws NotFoundError when not found", async () => {
      repo.findMe.mockResolvedValue(null as never);

      await expect(userService.getMe("missing")).rejects.toThrow(NotFoundError);
      await expect(userService.getMe("missing")).rejects.toThrow("Profile not found");
    });
  });

  describe("updateProfile", () => {
    it("updates when data provided", async () => {
      const profile = mockProfile({ id: "user-1" });
      repo.findById.mockResolvedValue(profile as never);
      repo.updateProfile.mockResolvedValue(undefined as never);

      await userService.updateProfile("user-1", { handle: "newhandle" });

      expect(repo.findById).toHaveBeenCalledWith("user-1");
      expect(repo.updateProfile).toHaveBeenCalledWith("user-1", { handle: "newhandle" });
    });

    it("throws NotFoundError when profile not found", async () => {
      repo.findById.mockResolvedValue(null as never);

      await expect(
        userService.updateProfile("missing", { handle: "x" }),
      ).rejects.toThrow(NotFoundError);

      expect(repo.updateProfile).not.toHaveBeenCalled();
    });

    it("does nothing when data is empty object", async () => {
      const profile = mockProfile();
      repo.findById.mockResolvedValue(profile as never);

      await userService.updateProfile("user-1", {});

      expect(repo.findById).toHaveBeenCalledWith("user-1");
      expect(repo.updateProfile).not.toHaveBeenCalled();
    });

    it("calls repository with correct userId and data", async () => {
      const profile = mockProfile({ id: "user-99" });
      repo.findById.mockResolvedValue(profile as never);
      repo.updateProfile.mockResolvedValue(undefined as never);

      const updateData = {
        handle: "updated",
        tradingLength: "3-5y",
        markets: ["fx", "crypto"],
        yearlyGoal: "100%",
      };

      await userService.updateProfile("user-99", updateData);

      expect(repo.updateProfile).toHaveBeenCalledTimes(1);
      expect(repo.updateProfile).toHaveBeenCalledWith("user-99", updateData);
    });
  });
});
