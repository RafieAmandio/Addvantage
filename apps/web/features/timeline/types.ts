import { z } from "zod";
import { IMPACT_LEVELS, BIAS_LEVELS } from "@tradevantage/shared";

/**
 * Closed set of timeline event kinds. Kept in lock-step with the
 * `timeline_events.kind` CHECK constraint in `packages/db/migrations/`.
 */
export const TIMELINE_KINDS = [
  "news",
  "tweet",
  "macro",
  "earnings",
  "user_pin",
] as const;
export type TimelineKind = (typeof TIMELINE_KINDS)[number];

/**
 * Runtime validator for a single `timeline_events` row. Lives here (not in
 * `queries/timeline.ts`) so client components can import it without dragging
 * in the server-only Supabase client.
 */
export const TimelineEventSchema = z.object({
  id: z.string(),
  kind: z.enum(TIMELINE_KINDS),
  source_code: z.string().nullable(),
  occurred_at: z.string(),
  symbols: z.array(z.string()),
  title: z.string(),
  body: z.string().nullable(),
  url: z.string().nullable(),
  bias: z.enum(BIAS_LEVELS).nullable(),
  impact: z.enum(IMPACT_LEVELS).nullable(),
  /** Backlink for kind='news' so a click can deeplink to /app/news/[id]. */
  news_item_id: z.string().nullable(),
});
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
