import { z } from "zod";

if (typeof window !== "undefined") {
  throw new Error(
    "[web] lib/config/server.ts imported from client bundle — use lib/config/public.ts instead"
  );
}
const emptyToUndef = (v: unknown) => (v === "" ? undefined : v);

const ServerEnvSchema = z.object({
  // Admin client throws at call time if missing; keep that contract by
  // marking this optional here.
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(
    emptyToUndef,
    z.string().min(1).optional()
  ),
  // Optional — webhook route returns 503 when unset rather than crashing.
  XENDIT_WEBHOOK_TOKEN: z.preprocess(
    emptyToUndef,
    z.string().min(1).optional()
  ),
  // All optional — helpers no-op when unset.
  BREVO_API_KEY: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  EMAIL_PROVIDER: z.preprocess(
    emptyToUndef,
    z.enum(["brevo"]).optional()
  ),
  EMAIL_SENDER_EMAIL: z.preprocess(
    emptyToUndef,
    z.string().email().optional()
  ),
  EMAIL_SENDER_NAME: z.preprocess(
    emptyToUndef,
    z.string().min(1).optional()
  ),
  DUNNING_TEMPLATE_ID: z.preprocess(
    emptyToUndef,
    z.coerce.number().int().positive().optional()
  ),
  // Optional — sentry.*.config.ts early-returns without init when unset.
  SENTRY_DSN: z.preprocess(emptyToUndef, z.string().url().optional()),
});

const parsed = ServerEnvSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `[web] invalid server env: ${JSON.stringify(parsed.error.format())}`
  );
}

export const serverConfig = parsed.data;
