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

const parsed = ServerEnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "[web] invalid server env:",
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  );
  throw new Error("[web] invalid server env — see above");
}

export const serverConfig = parsed.data;
