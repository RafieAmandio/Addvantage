"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { supabaseBrowser } from "@/lib/supabase/client";
import { isMockMode } from "@/lib/config/public";
import {
  TimelineEventSchema,
  type TimelineEvent,
} from "@/features/timeline/types";

// Cap in-memory events so long-lived sessions don't grow unbounded.
const MAX_EVENTS = 500;

interface UseTimelineEventsParams {
  initialEvents: TimelineEvent[];
  symbols: string[];
  from?: string;
  to?: string;
}

// Subscribes to all INSERTs and filters client-side — Supabase realtime can't filter text[] overlap.
export function useTimelineEvents({
  initialEvents,
  symbols,
  from,
  to,
}: UseTimelineEventsParams): { events: TimelineEvent[] } {
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents);

  const symbolsKey = useMemo(() => [...symbols].sort().join(","), [symbols]);
  const symbolsSet = useMemo(() => new Set(symbols), [symbolsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const seenRef = useRef<Set<string>>(new Set(initialEvents.map((e) => e.id)));

  useEffect(() => {
    seenRef.current = new Set(initialEvents.map((e) => e.id));
  }, [symbolsKey, initialEvents]);

  useEffect(() => {
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
