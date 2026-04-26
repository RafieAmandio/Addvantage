import { z } from "zod";

/**
 * Server-only env contract. Mirror of `apps/worker/src/lib/config.ts`;
 * never read `process.env` elsewhere in the web app — import
 * `serverConfig` from here.
 *
 * The `server-only` package isn't a direct dep here, so we use a runtime
 * guard instead: if this module is ever pulled into a client bundle the
 * import will throw during render.
 */
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
  // Xendit webhook static token (see apps/worker/src/adapters/payment/xendit.ts).
  // Optional so web can boot without payment integration wired; the webhook
  // route returns 503 when unset rather than 500-crashing.
  XENDIT_WEBHOOK_TOKEN: z.preprocess(
    emptyToUndef,
    z.string().min(1).optional()
  ),
  // Brevo transactional email (web-side duplicate of worker config; both
  // apps send independently). All optional: helpers no-op when unset.
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
  // Sentry server-side DSN. Optional — when unset, sentry.server.config.ts
  // and sentry.edge.config.ts early-return without calling Sentry.init().
  // Mirrors the graceful-noop pattern used elsewhere (Upstash/Brevo/etc.).
  SENTRY_DSN: z.preprocess(emptyToUndef, z.string().url().optional()),
});

const parsed = ServerEnvSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `[web] invalid server env: ${JSON.stringify(parsed.error.format())}`
  );
}

export const serverConfig = parsed.data;
type ServerConfig = typeof serverConfig;
