import { notFound } from "next/navigation";
import { EventDetailView } from "@/features/calendar/components/EventDetailView";
import { listNewsForEvent } from "@/features/calendar/queries/correlation";
import { eventContext } from "@/features/calendar/queries/context";
import { getTimelineEventById } from "@/features/timeline/queries/timeline";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CalendarEventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [event, news] = await Promise.all([
    getTimelineEventById(params.id),
    listNewsForEvent(params.id),
  ]);
  if (!event) return notFound();
  const context = await eventContext(event);
  return <EventDetailView event={event} news={news} {...context} />;
}
