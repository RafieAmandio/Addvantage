import { z } from "zod";

/**
 * Public env contract — `NEXT_PUBLIC_*` only. Safe to import from anywhere
 * (Server Components, Client Components, middleware, edge runtime). Next
 * inlines `NEXT_PUBLIC_*` at build time, so this works in client bundles.
 *
 * Mirror of `apps/worker/src/lib/config.ts` — never read `process.env`
 * elsewhere in the web app; import `publicConfig` from here.
 */
const emptyToUndef = (v: unknown) => (v === "" ? undefined : v);

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(emptyToUndef, z.string().url()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(
    emptyToUndef,
    z.string().min(1)
  ),
  NEXT_PUBLIC_SITE_URL: z.preprocess(
    emptyToUndef,
    z.string().url().default("http://localhost:3000")
  ),
});

// NEXT_PUBLIC_* are inlined at build time. We pick them explicitly so
// webpack's static replacement sees the references it needs to inline.
const parsed = PublicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsed.success) {
  // Do NOT process.exit — breaks edge runtime / client bundles. Throw instead.
  throw new Error(
    `[web] invalid public env: ${JSON.stringify(parsed.error.format())}`
  );
}

export const publicConfig = parsed.data;
export type PublicConfig = typeof publicConfig;
