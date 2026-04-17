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
  renderHeading,
  emptyMessage,
  maxHeightClass,
  className,
}: {
  initialEvents: TimelineEvent[];
  symbols: string[];
  from?: string;
  to?: string;
  heading?: string;
  renderHeading?: (count: number) => string;
  emptyMessage?: string;
  maxHeightClass?: string;
  className?: string;
}) {
  const { events } = useTimelineEvents({ initialEvents, symbols, from, to });
  return (
    <EventFeed
      events={events}
      heading={renderHeading ? renderHeading(events.length) : heading}
      emptyMessage={emptyMessage}
      maxHeightClass={maxHeightClass}
      className={className}
    />
  );
}
