import { z } from "zod";
import { IMPACT_LEVELS, BIAS_LEVELS } from "@tradevantage/shared";

// Must match timeline_events.kind CHECK constraint in DB migrations.
export const TIMELINE_KINDS = [
  "news",
  "tweet",
  "macro",
  "earnings",
  "user_pin",
] as const;
export type TimelineKind = (typeof TIMELINE_KINDS)[number];

// Lives here (not queries/) so client components can import without server-only deps.
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
  news_item_id: z.string().nullable(),
});
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
