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

/**
 * When `NEXT_PUBLIC_MOCK_MODE=1` the web app runs off static fixtures and
 * never touches Supabase. Auth is bypassed, a demo banner is shown, and the
 * four main dashboard surfaces (news, plan, watchlist, calendar) render from
 * features/[name]/mock.ts. Used to let teammates eyeball the UI without creds.
 */
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "1";

const PublicEnvSchema = z.object({
  // Optional-when-mock: so a coworker can boot the app with zero setup.
  // Non-mock builds still fail fast if these are missing (see refine below).
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(
    emptyToUndef,
    z.string().url().optional()
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(
    emptyToUndef,
    z.string().min(1).optional()
  ),
  NEXT_PUBLIC_SITE_URL: z.preprocess(
    emptyToUndef,
    z.string().url().default("http://localhost:3000")
  ),
  // Sentry client DSN. Optional — when unset, sentry.client.config.ts
  // early-returns without calling Sentry.init(). Separate from server-side
  // SENTRY_DSN because NEXT_PUBLIC_* is the only way to ship a value to the
  // browser bundle.
  NEXT_PUBLIC_SENTRY_DSN: z.preprocess(
    emptyToUndef,
    z.string().url().optional()
  ),
  NEXT_PUBLIC_MOCK_MODE: z.preprocess(
    emptyToUndef,
    z.enum(["0", "1"]).optional()
  ),
}).refine(
  (v) =>
    MOCK_MODE ||
    (!!v.NEXT_PUBLIC_SUPABASE_URL && !!v.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  {
    message:
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required (or set NEXT_PUBLIC_MOCK_MODE=1)",
    path: ["NEXT_PUBLIC_SUPABASE_URL"],
  }
);

// NEXT_PUBLIC_* are inlined at build time. We pick them explicitly so
// webpack's static replacement sees the references it needs to inline.
const parsed = PublicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_MOCK_MODE: process.env.NEXT_PUBLIC_MOCK_MODE,
});

if (!parsed.success) {
  // Do NOT process.exit — breaks edge runtime / client bundles. Throw instead.
  throw new Error(
    `[web] invalid public env: ${JSON.stringify(parsed.error.format())}`
  );
}

// Harmless placeholders keep the Supabase SDK constructor happy in mock
// mode — every call site is short-circuited before it reaches the network.
const MOCK_PLACEHOLDER_URL = "https://mock.local";
const MOCK_PLACEHOLDER_ANON_KEY = "mock-anon-key";

export const publicConfig = {
  ...parsed.data,
  NEXT_PUBLIC_SUPABASE_URL:
    parsed.data.NEXT_PUBLIC_SUPABASE_URL ?? MOCK_PLACEHOLDER_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? MOCK_PLACEHOLDER_ANON_KEY,
};
type PublicConfig = typeof publicConfig;

/** True when the app should serve static fixtures instead of hitting Supabase. */
export const isMockMode = (): boolean => MOCK_MODE;
