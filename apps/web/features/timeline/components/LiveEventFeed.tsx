"use client";

import type { TimelineEvent } from "@/features/timeline/types";
import { useTimelineEvents } from "@/features/timeline/hooks/useTimelineEvents";
import { EventFeed } from "./EventFeed";

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
  // String (not function) so it can cross the RSC → client boundary.
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
