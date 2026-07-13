import { z } from "zod";

if (typeof window !== "undefined") {
  throw new Error("lib/config/server.ts is server-only");
}

const emptyToUndef = (v: unknown) => (v === "" ? undefined : v);

const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  JWT_SECRET: z.preprocess(emptyToUndef, z.string().min(1)),

  NEXT_PUBLIC_API_URL: z.preprocess(
    emptyToUndef,
    z.string().url().default("http://localhost:3100"),
  ),

  NEXT_PUBLIC_SITE_URL: z.preprocess(
    emptyToUndef,
    z.string().url().default("http://localhost:3000"),
  ),

  SENTRY_DSN: z.preprocess(emptyToUndef, z.string().url().optional()),

  UPSTASH_REDIS_REST_URL: z.preprocess(emptyToUndef, z.string().url().optional()),
  UPSTASH_REDIS_REST_TOKEN: z.preprocess(emptyToUndef, z.string().min(1).optional()),
});

// During `next build` (page-data collection) the server-only secrets are not
// present — they are injected by Dokploy at runtime, and the build only gets
// NEXT_PUBLIC_* args (see CLAUDE.md "Deployment"). Next sets NEXT_PHASE to
// `phase-production-build` for the whole build process, so we relax the strict
// required-secret check for that phase only; runtime boot still validates for
// real. SKIP_ENV_VALIDATION=1 is an explicit escape hatch for the same purpose.
const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.SKIP_ENV_VALIDATION === "1";

const envSource = isBuildPhase
  ? { ...process.env, JWT_SECRET: process.env.JWT_SECRET ?? "build-time-placeholder" }
  : process.env;

const parsed = ServerEnvSchema.safeParse(envSource);

if (!parsed.success) {
  console.error(
    "[web] invalid server env:",
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  );
  throw new Error("[web] invalid server env — see above");
}

export const serverConfig = parsed.data;
