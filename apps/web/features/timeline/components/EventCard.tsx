import { memo } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { TimelineEvent } from "@/features/timeline/queries/timeline";

function kindBadge(kind: TimelineEvent["kind"]): string {
  switch (kind) {
    case "news":
      return "bg-brand/15 text-brand";
    case "tweet":
      return "bg-brand/10 text-brand/70";
    case "macro":
      return "bg-blood/15 text-blood-bright";
    case "earnings":
      return "bg-moss/15 text-moss";
    case "user_pin":
      return "bg-white/15 text-white/70";
  }
}

function formatTime(iso: string): string {
  return iso.slice(0, 16).replace("T", " ");
}

function eventHref(e: TimelineEvent): string | null {
  if (e.news_item_id) return `/app/news/${e.news_item_id}`;
  return e.url ?? null;
}

function EventCardInner({
  event,
  className,
}: {
  event: TimelineEvent;
  className?: string;
}) {
  const href = eventHref(event);
  const body = (
    <div className={cn("px-4 py-3 hover:bg-gray-3", className)}>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2",
            kindBadge(event.kind),
          )}
        >
          {event.kind}
        </span>
        {event.source_code && (
          <span className="font-mono text-[9px] uppercase tracking-widest2 text-brand">
            [{event.source_code}]
          </span>
        )}
        <span className="ml-auto font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          {formatTime(event.occurred_at)}
        </span>
      </div>
      <div className="mt-1.5 text-sm leading-snug text-white">{event.title}</div>
    </div>
  );
  if (!href) return body;
  return (
    <Link href={href} className="block focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none">
      {body}
    </Link>
  );
}

export const EventCard = memo(EventCardInner);
