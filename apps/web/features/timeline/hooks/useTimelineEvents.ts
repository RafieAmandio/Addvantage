"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { supabaseBrowser } from "@/lib/supabase/client";
import { isMockMode } from "@/lib/config/public";
import {
  TimelineEventSchema,
  type TimelineEvent,
} from "@/features/timeline/types";

/**
 * Hard cap on the in-memory events list so a long-lived chart session
 * can't grow the DOM without bound when realtime INSERTs keep streaming.
 * The EventFeed is scrollable; 500 rows is well past what a user will
 * scroll through and matches the server-side listTimelineEvents ceiling.
 */
const MAX_EVENTS = 500;

export interface UseTimelineEventsParams {
  initialEvents: TimelineEvent[];
  symbols: string[];
  /** ISO timestamp lower bound (inclusive). */
  from?: string;
  /** ISO timestamp upper bound (inclusive). */
  to?: string;
}

/**
 * Live-subscribe to new `timeline_events` INSERT rows and prepend the ones
 * that match the caller's symbol + window filter. Seeded with server-rendered
 * `initialEvents` so we never refetch on mount.
 *
 * Why no server-side filter on the channel: Supabase realtime's
 * `postgres_changes` filter syntax does not support `text[]` overlap checks,
 * so we subscribe to all INSERTs on the table and filter symbol+window on the
 * client. Table-wide INSERT volume is low (hourly ingestion pipeline), so this
 * is cheap.
 */
export function useTimelineEvents({
  initialEvents,
  symbols,
  from,
  to,
}: UseTimelineEventsParams): { events: TimelineEvent[] } {
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents);

  // Stable channel key so a symbol-set change re-subscribes but identical
  // renders don't.
  const symbolsKey = useMemo(() => [...symbols].sort().join(","), [symbols]);
  const symbolsSet = useMemo(() => new Set(symbols), [symbolsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track seen ids across renders to de-dupe (initial events + late duplicate
  // INSERT echoes).
  const seenRef = useRef<Set<string>>(new Set(initialEvents.map((e) => e.id)));

  useEffect(() => {
    // Reset seen set when the symbol key changes so a remount picks up fresh
    // initial state cleanly.
    seenRef.current = new Set(initialEvents.map((e) => e.id));
  }, [symbolsKey, initialEvents]);

  useEffect(() => {
    // Demo mode: no realtime — the initial fixture snapshot is all there is.
    if (isMockMode()) return;
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`timeline-events:${symbolsKey}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "timeline_events" },
        (payload) => {
          const parsed = TimelineEventSchema.safeParse(payload.new);
          if (!parsed.success) {
            Sentry.captureMessage(
              "useTimelineEvents: malformed payload",
              {
                level: "warning",
                extra: { issues: parsed.error.issues },
              }
            );
            return;
          }
          const row = parsed.data;

          // symbol intersection
          const matches = row.symbols.some((s) => symbolsSet.has(s));
          if (!matches) return;

          // window (inclusive)
          if (from && row.occurred_at < from) return;
          if (to && row.occurred_at > to) return;

          if (seenRef.current.has(row.id)) return;
          seenRef.current.add(row.id);

          setEvents((prev) => {
            const next = [row, ...prev];
            return next.length > MAX_EVENTS ? next.slice(0, MAX_EVENTS) : next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [symbolsKey, symbolsSet, from, to]);

  return { events };
}
