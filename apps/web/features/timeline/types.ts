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
  sourceCode: z.string().nullable(),
  occurredAt: z.string(),
  symbols: z.array(z.string()),
  title: z.string(),
  body: z.string().nullable(),
  url: z.string().nullable(),
  bias: z.enum(BIAS_LEVELS).nullable(),
  impact: z.enum(IMPACT_LEVELS).nullable(),
  newsItemId: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable().optional(),
});
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;

export function kindBadge(kind: TimelineKind): string {
  switch (kind) {
    case "news":
      return "bg-brand/15 text-brand";
    case "tweet":
      return "bg-brand/10 text-brand/70";
    case "macro":
      return "bg-blood/15 text-blood-bright";
    case "earnings":
      return "bg-moss/15 text-moss";
    case "user_pin":
      return "bg-white/15 text-white/70";
  }
}
