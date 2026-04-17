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
});

const parsed = ServerEnvSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `[web] invalid server env: ${JSON.stringify(parsed.error.format())}`
  );
}

export const serverConfig = parsed.data;
export type ServerConfig = typeof serverConfig;
