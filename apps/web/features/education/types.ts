import { z } from "zod";

/**
 * Shape of a primer as consumed by the UI. Mirrors the public projection
 * of `public.education_primers` (see features/education/queries/primers.ts)
 * and intentionally matches the legacy `Primer` interface in
 * `apps/web/lib/mock/types.ts` so existing components can accept either
 * a Supabase-backed primer or a mock one without a shape change.
 *
 * Lives in types.ts (not queries/) so client components can import the
 * schema/type without pulling server-only deps into the client bundle
 * (see LEARNINGS tick-91).
 */
export const PrimerSchema = z.object({
  id: z.string(), // slug — used in URLs (/app/education/[id])
  title: z.string(),
  author: z.string(),
  framework: z.string(),
  summary: z.string(),
  body: z.array(z.string()),
  tags: z.array(z.string()),
  readingMin: z.number().int().positive(),
  locked: z.boolean(),
});

export type Primer = z.infer<typeof PrimerSchema>;
