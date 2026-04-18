import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import {
  NEWS_LIST_COLUMNS,
  NewsListRowSchema,
  toNewsListItem,
  type NewsListItem,
} from "@/features/news/queries/news";

// Server-only guard: this file is a thin wrapper around `supabaseServer()`
// and must never land in a client bundle. We can't use the `server-only`
// package (not installed in this repo — see prior ticks), so fall back to
// the runtime-window sentinel pattern used across features/*/queries.
if (typeof window !== "undefined") {
  throw new Error(
    "features/calendar/queries/correlation.ts is server-only",
  );
}

/**
 * Narrow projection of the timeline_events row the correlation query needs.
 * We only read the fields required to compute the window + overlap set —
 * not the full TimelineEvent — so schema drift on unrelated columns won't
 * break this file.
 */
const EventShapeSchema = z.object({
  id: z.string(),
  occurred_at: z.string(),
  // `symbols` is the overlap axis on `timeline_events`; `news_items.affects`
  // is the mirroring array. EN1 copy in ROADMAP calls this `affects[]` on
  // the event for consistency, but the actual column is `symbols` (see
  // packages/db/src/types.ts). Overlap is computed in SQL against
  // `news_items.affects` using this value.
  symbols: z.array(z.string()),
});

const CORRELATION_WINDOW_MS = 2 * 60 * 60 * 1000; // ±2h
const MAX_RESULTS = 20;

/**
 * Returns published news items plausibly related to the given calendar
 * event. Two simple filters, composed server-side:
 *
 *   1. `news_items.published_at` falls within ±2h of the event's
 *      `occurred_at`.
 *   2. `news_items.affects[]` overlaps the event's `symbols[]` by at least
 *      one string.
 *
 * RLS on `news_items` already restricts public reads to `status='approved'`
 * — the explicit `.eq("status","approved")` is belt-and-braces so a future
 * policy relax doesn't silently leak pending/rejected rows into the UI.
 *
 * Errors (network, shape mismatch, missing event, empty `symbols`) all
 * return `[]` rather than throwing, matching the house convention in
 * `listApprovedNews` / `listTimelineEvents`.
 */
export async function listNewsForEvent(
  eventId: string,
): Promise<NewsListItem[]> {
  const supabase = supabaseServer();

  const eventRes = await supabase
    .from("timeline_events")
    .select("id, occurred_at, symbols")
    .eq("id", eventId)
    .maybeSingle();

  if (eventRes.error) {
    logger.error("listNewsForEvent: timeline_events read failed", {
      eventId,
      error: eventRes.error,
      scope: "calendar.listNewsForEvent",
    });
    return [];
  }
  if (!eventRes.data) return [];

  const eventParsed = EventShapeSchema.safeParse(eventRes.data);
  if (!eventParsed.success) {
    logger.error("listNewsForEvent: event shape mismatch", {
      eventId,
      issues: eventParsed.error.issues,
      scope: "calendar.listNewsForEvent",
    });
    return [];
  }
  const event = eventParsed.data;

  // No symbols → no useful overlap axis. Short-circuit rather than run a
  // scan that will return everything or nothing depending on PG operator
  // semantics for empty arrays.
  if (event.symbols.length === 0) return [];

  const occurredMs = Date.parse(event.occurred_at);
  if (Number.isNaN(occurredMs)) {
    logger.error("listNewsForEvent: occurred_at unparsable", {
      eventId,
      occurred_at: event.occurred_at,
      scope: "calendar.listNewsForEvent",
    });
    return [];
  }
  const from = new Date(occurredMs - CORRELATION_WINDOW_MS).toISOString();
  const to = new Date(occurredMs + CORRELATION_WINDOW_MS).toISOString();

  const newsRes = await supabase
    .from("news_items")
    .select(NEWS_LIST_COLUMNS)
    .eq("status", "approved")
    .gte("published_at", from)
    .lte("published_at", to)
    .overlaps("affects", event.symbols)
    .order("published_at", { ascending: false })
    .limit(MAX_RESULTS);

  if (newsRes.error) {
    logger.error("listNewsForEvent: news_items read failed", {
      eventId,
      error: newsRes.error,
      scope: "calendar.listNewsForEvent",
    });
    return [];
  }

  const parsed = NewsListRowSchema.array().safeParse(newsRes.data ?? []);
  if (!parsed.success) {
    logger.error("listNewsForEvent: news_items shape mismatch", {
      eventId,
      issues: parsed.error.issues,
      scope: "calendar.listNewsForEvent",
    });
    return [];
  }

  return parsed.data.map(toNewsListItem);
}
