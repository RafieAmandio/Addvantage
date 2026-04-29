import { vi } from "vitest";

vi.mock("@/config/env.js", () => ({
  env: {
    API_PORT: 3100,
    NODE_ENV: "test",
    LOG_LEVEL: "info",
    JWT_SECRET: "test-jwt-secret-at-least-32-chars-long",
    CORS_ORIGIN: ["http://localhost:3000"],
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    OPENAI_API_KEY: undefined,
    OPENAI_MODEL: "gpt-4o-mini",
    PAYMENT_PROVIDER: undefined,
    EMAIL_PROVIDER: undefined,
    XENDIT_SECRET_KEY: undefined,
    XENDIT_WEBHOOK_TOKEN: undefined,
    STORAGE_PROVIDER: undefined,
    STORAGE_BUCKET: undefined,
  },
}));

vi.mock("@/config/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));
