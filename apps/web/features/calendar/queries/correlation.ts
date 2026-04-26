import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import {
  NEWS_LIST_COLUMNS,
  NewsListRowSchema,
  toNewsListItem,
  type NewsListItem,
} from "@/features/news/queries/news";

if (typeof window !== "undefined") {
  throw new Error(
    "features/calendar/queries/correlation.ts is server-only",
  );
}

const EventShapeSchema = z.object({
  id: z.string(),
  occurred_at: z.string(),
  symbols: z.array(z.string()),
});

const CORRELATION_WINDOW_MS = 2 * 60 * 60 * 1000; // ±2h
const MAX_RESULTS = 20;

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
