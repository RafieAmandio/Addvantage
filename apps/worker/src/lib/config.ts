import { z } from "zod";
import "dotenv/config";

/**
 * Env contract. Validated at boot so the worker fails fast on misconfig.
 * Never read `process.env` anywhere else — import `config` from here.
 */
// Empty strings from .env files should be treated as "unset", not as
// invalid short strings. This lets us ship a template .env with blank fields.
const emptyToUndef = (v: unknown) => (v === "" ? undefined : v);

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),

  SUPABASE_URL: z.preprocess(emptyToUndef, z.string().url()),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(
    emptyToUndef,
    z.string().min(1).optional()
  ),

  OPENAI_API_KEY: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),

  TELEGRAM_BOT_TOKEN: z.preprocess(
    emptyToUndef,
    z.string().min(1).optional()
  ),
  TELEGRAM_ADMIN_CHAT_IDS: z
    .string()
    .default("")
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    ),

  SITE_URL: z.string().url().default("http://localhost:3000"),

  FRED_API_KEY: z.preprocess(emptyToUndef, z.string().min(1).optional()),

  /** Comma-separated adapter codes, e.g. "FRED,SC". Empty = all enabled in DB. */
  ENABLED_SOURCES: z
    .string()
    .default("")
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
    ),

  /** Optional outbound liveness ping target (healthchecks.io, BetterStack
   *  heartbeat URL, custom endpoint, etc.). The worker POSTs to this URL on
   *  boot and every HEARTBEAT_INTERVAL_MIN minutes. Unset = disabled. */
  HEARTBEAT_URL: z.preprocess(emptyToUndef, z.string().url().optional()),
  HEARTBEAT_INTERVAL_MIN: z.coerce.number().int().min(1).max(60).default(5),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    "[worker] invalid env:",
    JSON.stringify(parsed.error.format(), null, 2)
  );
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
