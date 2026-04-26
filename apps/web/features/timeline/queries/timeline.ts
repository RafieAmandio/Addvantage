import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import {
  TIMELINE_KINDS,
  TimelineEventSchema,
  type TimelineEvent,
  type TimelineKind,
} from "@/features/timeline/types";
import { isMockMode } from "@/lib/config/public";
import { mockTimelineEvents } from "@/lib/mock/fixtures";

export type { TimelineEvent };

const TIMELINE_EVENT_COLUMNS =
  "id,kind,source_code,occurred_at,symbols,title,body,url,bias,impact,news_item_id";

interface ListTimelineParams {
  /**
   * Symbols to filter by. If provided, must be non-empty — matches
   * `symbols && {…}` (array overlap) semantics. Omit to read across all
   * symbols (useful for kind-scoped views like the macro calendar).
   */
  symbols?: string[];
  /** Kinds to filter by (e.g. `['macro']` for the calendar). Omit for all. */
  kinds?: TimelineKind[];
  /** ISO timestamp lower bound (inclusive). */
  from?: string;
  /** ISO timestamp upper bound (inclusive). */
  to?: string;
  /** Hard cap on rows returned (so a misuse can't OOM the page). */
  limit?: number;
}

/**
 * Returns timeline events for the given filters + window. Reads directly
 * from `timeline_events` (the single source of truth since Phase C): news,
 * tweets, macro, earnings, and the caller's own pins. Newest-first by
 * `occurred_at`. Caller is responsible for slicing to the visible viewport.
 *
 * At least one of `symbols` or `kinds` SHOULD be provided to keep scans
 * bounded; an explicit `limit` is always applied regardless.
 */
export async function listTimelineEvents(
  params: ListTimelineParams
): Promise<TimelineEvent[]> {
  const { symbols, kinds, from, to, limit = 200 } = params;
  // If symbols filter is present but empty, caller wanted an intersection
  // with nothing — short-circuit. Omitted (undefined) means "all symbols".
  if (symbols && symbols.length === 0) return [];
  if (kinds && kinds.length === 0) return [];

  if (isMockMode()) {
    const all = mockTimelineEvents()
      .filter((r) => (kinds ? kinds.includes(r.kind) : true))
      .filter((r) => (symbols ? r.symbols.some((s) => symbols.includes(s)) : true))
      .filter((r) => (from ? r.occurred_at >= from : true))
      .filter((r) => (to ? r.occurred_at <= to : true))
      .sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1));
    return all.slice(0, limit);
  }

  const supabase = supabaseServer();

  let teQ = supabase
    .from("timeline_events")
    .select(TIMELINE_EVENT_COLUMNS)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (symbols) teQ = teQ.overlaps("symbols", symbols);
  if (kinds) teQ = teQ.in("kind", kinds);
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

/**
 * Single timeline_events row by id. Same narrow projection as
 * `listTimelineEvents` so the detail view speaks the identical schema.
 * Returns `null` on not-found, shape mismatch, or network error (matching
 * the feature's fail-soft convention — callers fall through to `notFound()`).
 */
export async function getTimelineEventById(
  id: string
): Promise<TimelineEvent | null> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("timeline_events")
    .select(TIMELINE_EVENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logger.error("getTimelineEventById: timeline_events read failed", {
      id,
      error,
      scope: "timeline.getTimelineEventById",
    });
    return null;
  }
  if (!data) return null;

  const parsed = TimelineEventSchema.safeParse(data);
  if (!parsed.success) {
    logger.error("getTimelineEventById: timeline_events shape mismatch", {
      id,
      issues: parsed.error.issues,
      scope: "timeline.getTimelineEventById",
    });
    return null;
  }
  return parsed.data;
}
