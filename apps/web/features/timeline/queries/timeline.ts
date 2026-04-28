import { cache } from "react";
import {
  type TimelineEvent,
  type TimelineKind,
} from "@/features/timeline/types";
import { isMockMode } from "@/lib/config/public";
import { mockTimelineEvents } from "@/lib/mock/fixtures";
import { apiGet } from "@/lib/api/client-server";

export type { TimelineEvent };

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

  try {
    const qs = new URLSearchParams();
    if (symbols) qs.set("symbols", symbols.join(","));
    if (kinds) qs.set("kinds", kinds.join(","));
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    qs.set("limit", String(limit));
    const data = await apiGet<TimelineEvent[]>(`/timeline?${qs.toString()}`);
    return data ?? [];
  } catch {
    return [];
  }
}

export const getTimelineEventById = cache(async function getTimelineEventById(
  id: string
): Promise<TimelineEvent | null> {
  try {
    return await apiGet<TimelineEvent>(`/timeline/${id}`);
  } catch {
    return null;
  }
});
