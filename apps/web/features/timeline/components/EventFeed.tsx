import { cn } from "@/lib/cn";
import type { TimelineEvent } from "@/features/timeline/queries/timeline";
import { EventCard } from "./EventCard";

export function EventFeed({
  events,
  heading,
  emptyMessage = "No events in window.",
  maxHeightClass = "max-h-[520px]",
  className,
}: {
  events: TimelineEvent[];
  heading?: string;
  emptyMessage?: string;
  maxHeightClass?: string;
  className?: string;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-2xl bg-panel p-5", className)}>
      {heading && <h2 className="mb-3 text-[15px] font-semibold leading-[22px] text-white">{heading}</h2>}
      {events.length === 0 ? (
        <p className="py-6 text-center text-[14px] text-white/40">{emptyMessage}</p>
      ) : (
        <ul className={cn("-mx-2 divide-y divide-white/[0.07] overflow-y-auto", maxHeightClass)}>
          {events.map((e) => (
            <li key={e.id}>
              <EventCard event={e} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
