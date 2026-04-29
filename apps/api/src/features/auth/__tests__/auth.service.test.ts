import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockFindByEmail,
  mockFindById,
  mockCreate,
  mockMarkEmailVerified,
  mockHash,
  mockCompare,
  mockGetEmailProvider,
} = vi.hoisted(() => ({
  mockFindByEmail: vi.fn(),
  mockFindById: vi.fn(),
  mockCreate: vi.fn(),
  mockMarkEmailVerified: vi.fn(),
  mockHash: vi.fn().mockResolvedValue("$2b$12$hashedpassword"),
  mockCompare: vi.fn(),
  mockGetEmailProvider: vi.fn().mockReturnValue(null),
}));

vi.mock("../auth.repository.js", () => ({
  authRepository: {
    findByEmail: mockFindByEmail,
    findById: mockFindById,
    create: mockCreate,
    markEmailVerified: mockMarkEmailVerified,
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: mockHash,
    compare: mockCompare,
  },
}));

vi.mock("@/integrations/email/index.js", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/integrations/email/index.js");
  return {
    ...actual,
    getEmailProvider: mockGetEmailProvider,
  };
});

import { authService } from "../auth.service.js";

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("creates a profile and returns tokens", async () => {
      mockFindByEmail.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        handle: "tester",
        tier: "free",
        isAdmin: false,
      });

      const result = await authService.register({
        email: "test@example.com",
        password: "password123",
        handle: "tester",
      });

      expect(result.profile.id).toBe("user-1");
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(mockCreate).toHaveBeenCalledWith({
        email: "test@example.com",
        passwordHash: "$2b$12$hashedpassword",
        handle: "tester",
      });
    });

    it("throws 409 if email already exists", async () => {
      mockFindByEmail.mockResolvedValue({ id: "existing" });

      await expect(
        authService.register({ email: "taken@example.com", password: "password123" }),
      ).rejects.toThrow("Email already registered");
    });
  });

  describe("login", () => {
    const profile = {
      id: "user-1",
      email: "test@example.com",
      handle: "tester",
      passwordHash: "$2b$12$hashedpassword",
      emailVerified: true,
      tier: "free",
      isAdmin: false,
    };

    it("returns tokens on valid credentials", async () => {
      mockFindByEmail.mockResolvedValue(profile);
      mockCompare.mockResolvedValue(true);

      const result = await authService.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.profile.id).toBe("user-1");
      expect(result.profile).not.toHaveProperty("passwordHash");
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
    });

    it("throws 401 if user not found", async () => {
      mockFindByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: "ghost@example.com", password: "nope" }),
      ).rejects.toThrow("Invalid email or password");
    });

    it("throws 401 if password is wrong", async () => {
      mockFindByEmail.mockResolvedValue(profile);
      mockCompare.mockResolvedValue(false);

      await expect(
        authService.login({ email: "test@example.com", password: "wrong" }),
      ).rejects.toThrow("Invalid email or password");
    });

    it("throws 401 if profile has no passwordHash", async () => {
      mockFindByEmail.mockResolvedValue({ ...profile, passwordHash: null });

      await expect(
        authService.login({ email: "test@example.com", password: "any" }),
      ).rejects.toThrow("Invalid email or password");
    });

    it("throws 403 if email not verified", async () => {
      mockFindByEmail.mockResolvedValue({ ...profile, emailVerified: false });
      mockCompare.mockResolvedValue(true);

      await expect(
        authService.login({ email: "test@example.com", password: "password123" }),
      ).rejects.toThrow("Please verify your email before logging in");
    });
  });

  describe("refresh", () => {
    it("returns new token pair", async () => {
      mockFindById.mockResolvedValue({ id: "user-1", email: "test@example.com", emailVerified: true });

      const result = await authService.refresh("user-1");

      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
    });

    it("throws 401 if user not found", async () => {
      mockFindById.mockResolvedValue(null);

      await expect(authService.refresh("ghost")).rejects.toThrow("User not found");
    });
  });

  describe("verifyEmail", () => {
    it("throws on invalid token", async () => {
      await expect(authService.verifyEmail("bad-token")).rejects.toThrow(
        "Invalid or expired verification token",
      );
    });
  });

  describe("resendVerification", () => {
    it("throws 404 if user not found", async () => {
      mockFindById.mockResolvedValue(null);

      await expect(authService.resendVerification("ghost")).rejects.toThrow("User not found");
    });

    it("throws 400 if email already verified", async () => {
      mockFindById.mockResolvedValue({ id: "u1", email: "a@b.com", emailVerified: true });

      await expect(authService.resendVerification("u1")).rejects.toThrow("Email already verified");
    });
  });
});
