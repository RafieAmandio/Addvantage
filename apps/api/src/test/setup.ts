import { vi } from "vitest";

vi.mock("@/config/env.js", () => ({
  env: {
    PORT: 3100,
    SUPABASE_URL: "http://localhost:54321",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    SUPABASE_ANON_KEY: "test-anon-key",
    CORS_ORIGIN: "http://localhost:3000",
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    OPENAI_API_KEY: undefined,
    OPENAI_MODEL: "gpt-4o-mini",
    PAYMENT_PROVIDER: undefined,
    EMAIL_PROVIDER: undefined,
    XENDIT_WEBHOOK_TOKEN: undefined,
    DUNNING_TEMPLATE_ID: undefined,
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
