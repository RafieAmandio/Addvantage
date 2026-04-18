import { Suspense } from "react";
import { CalendarFallback } from "@/features/calendar/components/CalendarFallback";
import { CalendarPageView } from "@/features/calendar/components/CalendarPageView";
import { timelineEventToCalendarEvent } from "@/features/calendar/lib/fromTimeline";
import { listTimelineEvents } from "@/features/timeline/queries/timeline";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Fetch macro calendar events directly from `timeline_events` (kind='macro')
 * seeded by the FF adapter. Window: ±30 days around "now" — wide enough to
 * cover the calendar's week/month views without slicing per-nav.
 */
async function CalendarData() {
  const now = Date.now();
  const from = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const to = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();

  const rows = await listTimelineEvents({
    kinds: ["macro"],
    from,
    to,
    limit: 500,
  });
  const events = rows.map(timelineEventToCalendarEvent);

  return <CalendarPageView events={events} />;
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarFallback />}>
      <CalendarData />
    </Suspense>
  );
}
