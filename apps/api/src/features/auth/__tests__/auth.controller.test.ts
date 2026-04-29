import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { mockAuthMiddleware, TEST_USER } from "@/test/helpers.js";
import { errorHandler } from "@/core/middleware/error.middleware.js";
import { validate } from "@/core/middleware/validate.middleware.js";

const mockRegister = vi.fn();
const mockLogin = vi.fn();
const mockRefresh = vi.fn();
const mockVerifyEmail = vi.fn();
const mockResendVerification = vi.fn();

vi.mock("../auth.service.js", () => ({
  authService: {
    register: (...args: unknown[]) => mockRegister(...args),
    login: (...args: unknown[]) => mockLogin(...args),
    refresh: (...args: unknown[]) => mockRefresh(...args),
    verifyEmail: (...args: unknown[]) => mockVerifyEmail(...args),
    resendVerification: (...args: unknown[]) => mockResendVerification(...args),
  },
}));

vi.mock("@/config/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { authController } from "../auth.controller.js";
import { registerSchema, loginSchema } from "../auth.validation.js";

function createApp() {
  const app = express();
  app.use(express.json());
  app.post("/register", validate({ body: registerSchema }), authController.register);
  app.post("/login", validate({ body: loginSchema }), authController.login);
  app.post("/refresh", mockAuthMiddleware(TEST_USER), authController.refresh);
  app.get("/verify-email", authController.verifyEmail);
  app.post("/resend-verification", mockAuthMiddleware(TEST_USER), authController.resendVerification);
  app.post("/logout", mockAuthMiddleware(TEST_USER), authController.logout);
  app.use(errorHandler);
  return app;
}

describe("authController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /register", () => {
    it("registers and returns 201 with tokens", async () => {
      mockRegister.mockResolvedValue({
        profile: { id: "u1", email: "new@test.com", tier: "free" },
        accessToken: "at",
        refreshToken: "rt",
      });

      const res = await request(createApp())
        .post("/register")
        .send({ email: "new@test.com", password: "password123" });

      expect(res.status).toBe(201);
      expect(res.body.data.accessToken).toBe("at");
      expect(res.body.data.refreshToken).toBe("rt");
    });

    it("returns 400 for invalid email", async () => {
      const res = await request(createApp())
        .post("/register")
        .send({ email: "not-an-email", password: "password123" });

      expect(res.status).toBe(400);
    });

    it("returns 400 for short password", async () => {
      const res = await request(createApp())
        .post("/register")
        .send({ email: "a@b.com", password: "short" });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /login", () => {
    it("logs in and returns tokens", async () => {
      mockLogin.mockResolvedValue({
        profile: { id: "u1", email: "user@test.com" },
        accessToken: "at",
        refreshToken: "rt",
      });

      const res = await request(createApp())
        .post("/login")
        .send({ email: "user@test.com", password: "password123" });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBe("at");
    });

    it("returns 400 for missing password", async () => {
      const res = await request(createApp())
        .post("/login")
        .send({ email: "user@test.com" });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /refresh", () => {
    it("returns new token pair", async () => {
      mockRefresh.mockResolvedValue({ accessToken: "new-at", refreshToken: "new-rt" });

      const res = await request(createApp()).post("/refresh");

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBe("new-at");
      expect(mockRefresh).toHaveBeenCalledWith(TEST_USER.id);
    });
  });

  describe("GET /verify-email", () => {
    it("verifies email with valid token", async () => {
      mockVerifyEmail.mockResolvedValue({ verified: true });

      const res = await request(createApp()).get("/verify-email?token=valid-token");

      expect(res.status).toBe(200);
      expect(res.body.data.verified).toBe(true);
      expect(mockVerifyEmail).toHaveBeenCalledWith("valid-token");
    });
  });

  describe("POST /resend-verification", () => {
    it("resends verification email", async () => {
      mockResendVerification.mockResolvedValue({ sent: true });

      const res = await request(createApp()).post("/resend-verification");

      expect(res.status).toBe(200);
      expect(mockResendVerification).toHaveBeenCalledWith(TEST_USER.id);
    });
  });

  describe("POST /logout", () => {
    it("returns success", async () => {
      const res = await request(createApp()).post("/logout");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Logged out");
    });
  });
});
