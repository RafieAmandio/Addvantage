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
    <div className={cn("border border-gray-3 bg-gray-2", className)}>
      {heading && (
        <div className="border-b border-gray-3 px-4 py-3 font-mono text-[10px] uppercase tracking-widest2 text-paper/60">
          {heading}
        </div>
      )}
      {events.length === 0 ? (
        <div className="px-4 py-8 text-center font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
          {emptyMessage}
        </div>
      ) : (
        <ul className={cn("divide-y divide-ink-3 overflow-y-auto", maxHeightClass)}>
          {events.map((e) => (
            <li key={e.id}>
              <EventCard event={e} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
