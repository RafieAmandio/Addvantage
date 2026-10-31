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
      return "text-white/70";
    case "tweet":
      return "text-white/55";
    case "macro":
      return "text-brand";
    case "earnings":
      return "text-white/55";
    case "user_pin":
      return "text-white/40";
  }
}
