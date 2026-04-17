import { z } from "zod";
import { IMPACT_LEVELS, BIAS_LEVELS } from "@tradevantage/shared";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const TIMELINE_KINDS = ["news", "tweet", "macro", "earnings", "user_pin"] as const;
export type TimelineKind = (typeof TIMELINE_KINDS)[number];

const ImpactSchema = z.enum(IMPACT_LEVELS);
const BiasSchema = z.enum(BIAS_LEVELS);

/**
 * Public-facing shape rendered by `TimelineMarkers` / `EventDrawer`. Stable
 * across all event kinds — `timeline_events` is the single source of truth
 * since Phase C; approved `news_items` rows are mirrored into it by the
 * `news_items_mirror_to_timeline` trigger (see migration 0014).
 */
const TimelineEventSchema = z.object({
  id: z.string(),
  kind: z.enum(TIMELINE_KINDS),
  source_code: z.string().nullable(),
  occurred_at: z.string(),
  symbols: z.array(z.string()),
  title: z.string(),
  body: z.string().nullable(),
  url: z.string().nullable(),
  bias: BiasSchema.nullable(),
  impact: ImpactSchema.nullable(),
  /** Backlink for kind='news' so a click can deeplink to /app/news/[id]. */
  news_item_id: z.string().nullable(),
});
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;

const TIMELINE_EVENT_COLUMNS =
  "id,kind,source_code,occurred_at,symbols,title,body,url,bias,impact,news_item_id";

export interface ListTimelineParams {
  /** Symbols to filter by — at least one. Matches `symbols && {…}` semantics. */
  symbols: string[];
  /** ISO timestamp lower bound (inclusive). */
  from?: string;
  /** ISO timestamp upper bound (inclusive). */
  to?: string;
  /** Hard cap on rows returned (so a misuse can't OOM the page). */
  limit?: number;
}

/**
 * Returns timeline events for the given symbols + window. Reads directly
 * from `timeline_events` (the single source of truth since Phase C): news,
 * tweets, macro, earnings, and the caller's own pins. Newest-first by
 * `occurred_at`. Caller is responsible for slicing to the visible viewport.
 */
export async function listTimelineEvents(
  params: ListTimelineParams
): Promise<TimelineEvent[]> {
  const { symbols, from, to, limit = 200 } = params;
  if (symbols.length === 0) return [];

  const supabase = supabaseServer();

  let teQ = supabase
    .from("timeline_events")
    .select(TIMELINE_EVENT_COLUMNS)
    .overlaps("symbols", symbols)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (from) teQ = teQ.gte("occurred_at", from);
  if (to) teQ = teQ.lte("occurred_at", to);

  const teRes = await teQ;

  if (teRes.error) {
    logger.error("listTimelineEvents: timeline_events read failed", {
      error: teRes.error,
      scope: "timeline.listTimelineEvents",
    });
    return [];
  }

  const parsed = TimelineEventSchema.array().safeParse(teRes.data ?? []);
  if (!parsed.success) {
    logger.error("listTimelineEvents: timeline_events shape mismatch", {
      issues: parsed.error.issues,
      scope: "timeline.listTimelineEvents",
    });
    return [];
  }

  return parsed.data;
}
