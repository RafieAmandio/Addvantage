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
 * regardless of source — news_items rows are projected into this shape so
 * the chart can show editorial coverage before the timeline_events table is
 * backfilled.
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

/**
 * Row shape from the news_items projection. We pull only what TimelineEvent
 * needs and synthesise the rest at the boundary.
 */
const NewsAsTimelineRowSchema = z.object({
  id: z.string(),
  source_code: z.string(),
  headline: z.string(),
  analysis: z.string(),
  affects: z.array(z.string()),
  bias: BiasSchema,
  impact: ImpactSchema,
  published_at: z.string().nullable(),
  fetched_at: z.string(),
  source_url: z.string().nullable(),
});

export interface ListTimelineParams {
  /** Symbols to filter by — at least one. Matches `symbols && {…}` semantics. */
  symbols: string[];
  /** ISO timestamp lower bound (inclusive). */
  from?: string;
  /** ISO timestamp upper bound (inclusive). */
  to?: string;
  /** Hard cap on rows returned per source (so a misuse can't OOM the page). */
  limit?: number;
}

/**
 * Returns timeline events for the given symbols + window, merging:
 *   - direct `timeline_events` rows (editorial kinds; RLS hides user_pin)
 *   - approved `news_items` projected as `kind='news'` (the legacy editorial
 *     dataset — backfill into `timeline_events` will land in Phase B).
 *
 * Returned newest-first by `occurred_at`. Caller is responsible for slicing
 * to the visible viewport.
 */
export async function listTimelineEvents(
  params: ListTimelineParams
): Promise<TimelineEvent[]> {
  const { symbols, from, to, limit = 200 } = params;
  if (symbols.length === 0) return [];

  const supabase = supabaseServer();

  // ---- timeline_events table ----
  let teQ = supabase
    .from("timeline_events")
    .select(TIMELINE_EVENT_COLUMNS)
    .overlaps("symbols", symbols)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (from) teQ = teQ.gte("occurred_at", from);
  if (to) teQ = teQ.lte("occurred_at", to);

  // ---- news_items projection ----
  let niQ = supabase
    .from("news_items")
    .select(
      "id,source_code,headline,analysis,affects,bias,impact,published_at,fetched_at,source_url"
    )
    .eq("status", "approved")
    .overlaps("affects", symbols)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("fetched_at", { ascending: false })
    .limit(limit);
  if (from) niQ = niQ.gte("published_at", from);
  if (to) niQ = niQ.lte("published_at", to);

  const [teRes, niRes] = await Promise.all([teQ, niQ]);

  const events: TimelineEvent[] = [];

  if (teRes.error) {
    logger.error("listTimelineEvents: timeline_events read failed", {
      error: teRes.error,
      scope: "timeline.listTimelineEvents",
    });
  } else {
    const parsed = TimelineEventSchema.array().safeParse(teRes.data ?? []);
    if (parsed.success) {
      events.push(...parsed.data);
    } else {
      logger.error("listTimelineEvents: timeline_events shape mismatch", {
        issues: parsed.error.issues,
        scope: "timeline.listTimelineEvents",
      });
    }
  }

  if (niRes.error) {
    logger.error("listTimelineEvents: news_items read failed", {
      error: niRes.error,
      scope: "timeline.listTimelineEvents",
    });
  } else {
    const parsed = NewsAsTimelineRowSchema.array().safeParse(niRes.data ?? []);
    if (parsed.success) {
      for (const n of parsed.data) {
        events.push({
          id: `news:${n.id}`,
          kind: "news",
          source_code: n.source_code,
          occurred_at: n.published_at ?? n.fetched_at,
          symbols: n.affects,
          title: n.headline,
          body: n.analysis,
          url: n.source_url,
          bias: n.bias,
          impact: n.impact,
          news_item_id: n.id,
        });
      }
    } else {
      logger.error("listTimelineEvents: news_items shape mismatch", {
        issues: parsed.error.issues,
        scope: "timeline.listTimelineEvents",
      });
    }
  }

  events.sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1));
  return events.slice(0, limit);
}
