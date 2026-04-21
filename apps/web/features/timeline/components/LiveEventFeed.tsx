"use client";

import type { TimelineEvent } from "@/features/timeline/types";
import { useTimelineEvents } from "@/features/timeline/hooks/useTimelineEvents";
import { EventFeed } from "./EventFeed";

/**
 * Thin client wrapper around `EventFeed` that live-appends new
 * `timeline_events` INSERTs matching the given symbols + window. Seeded by
 * `initialEvents` from the server; never refetches on mount.
 */
export function LiveEventFeed({
  initialEvents,
  symbols,
  from,
  to,
  heading,
  headingPrefix,
  emptyMessage,
  maxHeightClass,
  className,
}: {
  initialEvents: TimelineEvent[];
  symbols: string[];
  from?: string;
  to?: string;
  heading?: string;
  /**
   * When set, renders `${headingPrefix} · ${count} events` with the live
   * count. Kept as a string (not a function prop) so Server Components can
   * hand it across the RSC boundary without tripping the
   * "Functions cannot be passed directly to Client Components" rule.
   */
  headingPrefix?: string;
  emptyMessage?: string;
  maxHeightClass?: string;
  className?: string;
}) {
  const { events } = useTimelineEvents({ initialEvents, symbols, from, to });
  const resolvedHeading = headingPrefix
    ? `${headingPrefix} · ${events.length} events`
    : heading;
  return (
    <EventFeed
      events={events}
      heading={resolvedHeading}
      emptyMessage={emptyMessage}
      maxHeightClass={maxHeightClass}
      className={className}
    />
  );
}
