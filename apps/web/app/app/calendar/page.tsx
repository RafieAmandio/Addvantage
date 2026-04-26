import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarFallback } from "@/features/calendar/components/CalendarFallback";

export const metadata: Metadata = { title: "Calendar" };
import { CalendarPageView } from "@/features/calendar/components/CalendarPageView";
import { timelineEventToCalendarEvent } from "@/features/calendar/lib/fromTimeline";
import { listTimelineEvents } from "@/features/timeline/queries/timeline";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
