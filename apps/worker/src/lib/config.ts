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

  /** Market-data provider for the bars pipeline (Phase B). Keep as an enum so
   *  adding a new provider requires a code change (intentional — forces the
   *  author to also register the adapter). Phase B is not yet deployed, so
   *  both envs are optional; see refine() below for the coupling check. */
  MARKET_DATA_PROVIDER: z
    .preprocess(emptyToUndef, z.enum(["twelvedata"]).optional()),
  MARKET_DATA_API_KEY: z.preprocess(emptyToUndef, z.string().min(1).optional()),

  /** Upstash Redis REST creds for single-flight coalescing. Optional —
   *  when unset, singleflight degrades to a direct fetcher() call. */
  UPSTASH_REDIS_REST_URL: z.preprocess(emptyToUndef, z.string().url().optional()),
  UPSTASH_REDIS_REST_TOKEN: z.preprocess(
    emptyToUndef,
    z.string().min(1).optional()
  ),

  /** Xendit payment provider. Both envs optional — when either is unset the
   *  XenditAdapter will not self-register in `adapters/payment/index.ts`,
   *  and `getPaymentAdapter('xendit')` will throw the standard
   *  "unknown adapter" error. */
  XENDIT_SECRET_KEY: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  XENDIT_WEBHOOK_TOKEN: z.preprocess(
    emptyToUndef,
    z.string().min(1).optional()
  ),

  /** Brevo (formerly Sendinblue) transactional email provider. When
   *  BREVO_API_KEY is unset the BrevoAdapter will not self-register in
   *  `adapters/email/index.ts`, and `getEmailAdapter('brevo')` will throw
   *  the standard "unknown adapter" error. EMAIL_PROVIDER is reserved for
   *  the scheduler/webhook wiring (E3/E4) to pick a default sender. */
  EMAIL_PROVIDER: z.preprocess(emptyToUndef, z.enum(["brevo"]).optional()),
  BREVO_API_KEY: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  /** Verified-sender identity used by every outbound email. Brevo (and most
   *  transactional providers) will reject sends from any address that isn't
   *  verified in the provider dashboard. TODO: override these in prod env
   *  before going live — the defaults below are placeholders so dev boots
   *  cleanly. */
  EMAIL_SENDER_EMAIL: z.preprocess(
    emptyToUndef,
    z.string().email().optional()
  ).transform((v) => v ?? "noreply@tradevantage.app"),
  EMAIL_SENDER_NAME: z.preprocess(
    emptyToUndef,
    z.string().min(1).optional()
  ).transform((v) => v ?? "TradeVantage"),

  /** Brevo numeric templateId used by the E3 renewal-reminder scheduler task.
   *  Optional — when unset, the daily renewal cron is not registered and the
   *  worker boots with no email traffic. */
  RENEWAL_TEMPLATE_ID: z.coerce.number().int().positive().optional(),

  /** Better Stack (Logtail) log ingestion. When LOGTAIL_SOURCE_TOKEN is set,
   *  the worker's pino logger dual-writes to stdout + Better Stack via the
   *  `@logtail/pino` transport. When unset, the logger is untouched (stdout
   *  only) — the worker never crashes because this env is missing.
   *  LOGTAIL_ENDPOINT is optional and lets you override the ingest host for
   *  region-specific Better Stack sources; the default matches `@logtail/node`
   *  (https://in.logs.betterstack.com). */
  LOGTAIL_SOURCE_TOKEN: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  LOGTAIL_ENDPOINT: z.preprocess(emptyToUndef, z.string().url().optional()),
})
.refine(
  (env) =>
    (env.MARKET_DATA_PROVIDER === undefined) ===
    (env.MARKET_DATA_API_KEY === undefined),
  {
    message:
      "MARKET_DATA_PROVIDER and MARKET_DATA_API_KEY must be set together (or both unset).",
    path: ["MARKET_DATA_API_KEY"],
  }
);

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
