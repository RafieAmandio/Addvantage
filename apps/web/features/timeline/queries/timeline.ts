import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import {
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
  symbols?: string[];
  kinds?: TimelineKind[];
  from?: string;
  to?: string;
  limit?: number;
}

export async function listTimelineEvents(
  params: ListTimelineParams
): Promise<TimelineEvent[]> {
  const { symbols, kinds, from, to, limit = 200 } = params;
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
