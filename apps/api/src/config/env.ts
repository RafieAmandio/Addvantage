import { z } from "zod";
import "dotenv/config";

const emptyToUndef = (v: unknown) => (v === "" ? undefined : v);

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  API_PORT: z.coerce.number().default(3100),

  DATABASE_URL: z.preprocess(emptyToUndef, z.string().min(1).optional()),

  JWT_SECRET: z.preprocess(emptyToUndef, z.string().min(1)),

  SUPABASE_URL: z.preprocess(emptyToUndef, z.string().url().optional()),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(emptyToUndef, z.string().min(1).optional()),

  CORS_ORIGIN: z
    .string()
    .default("http://localhost:3199")
    .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)),

  UPSTASH_REDIS_REST_URL: z.preprocess(emptyToUndef, z.string().url().optional()),
  UPSTASH_REDIS_REST_TOKEN: z.preprocess(emptyToUndef, z.string().min(1).optional()),

  LLM_PROVIDER: z.enum(["openai", "openlimits"]).default("openai"),
  LLM_API_KEY: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  LLM_MODEL: z.string().default("gpt-4o-mini"),
  LLM_BASE_URL: z.preprocess(emptyToUndef, z.string().url().optional()),

  PAYMENT_PROVIDER: z.preprocess(emptyToUndef, z.enum(["xendit", "stripe"]).optional()),
  XENDIT_SECRET_KEY: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  XENDIT_WEBHOOK_TOKEN: z.preprocess(emptyToUndef, z.string().min(1).optional()),

  EMAIL_PROVIDER: z.preprocess(emptyToUndef, z.enum(["brevo", "resend"]).optional()),
  BREVO_API_KEY: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  RESEND_API_KEY: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  EMAIL_SENDER_EMAIL: z.preprocess(emptyToUndef, z.string().email().optional()),
  EMAIL_SENDER_NAME: z.preprocess(emptyToUndef, z.string().optional()),

  SITE_URL: z.preprocess(emptyToUndef, z.string().url().default("http://localhost:3000")),

  SENTRY_DSN: z.preprocess(emptyToUndef, z.string().url().optional()),

  MARKET_DATA_API_KEY: z.preprocess(emptyToUndef, z.string().min(1).optional()),

  SERVICE_TOKEN_SECRET: z.preprocess(emptyToUndef, z.string().min(32).optional()),

  TELEGRAM_BOT_TOKEN: z.preprocess(emptyToUndef, z.string().min(1).optional()),

  // WhatsApp bridge (Jeff/Hermes Baileys bridge) — consult notifications to the
  // TradeVantage group. All optional: notify is a no-op unless URL + group are set.
  WHATSAPP_BRIDGE_URL: z.preprocess(emptyToUndef, z.string().url().optional()),
  WHATSAPP_BRIDGE_TOKEN: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  WHATSAPP_CONSULT_GROUP_JID: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  // Comma-separated JIDs to @-mention (e.g. Anthony's 97925355024479@lid).
  WHATSAPP_CONSULT_MENTION_JIDS: z.preprocess(emptyToUndef, z.string().optional()),
  // Visible mention token that pairs with the JIDs above (e.g. "@Anthony").
  WHATSAPP_CONSULT_MENTION_TEXT: z.preprocess(emptyToUndef, z.string().optional()),

  STORAGE_PROVIDER: z.preprocess(emptyToUndef, z.enum(["supabase", "s3"]).optional()),
  STORAGE_BUCKET: z.preprocess(emptyToUndef, z.string().min(1).optional()),

  AWS_S3_BUCKET: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  AWS_S3_REGION: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  AWS_ACCESS_KEY_ID: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  AWS_SECRET_ACCESS_KEY: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  AWS_S3_ENDPOINT: z.preprocess(emptyToUndef, z.string().url().optional()),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
