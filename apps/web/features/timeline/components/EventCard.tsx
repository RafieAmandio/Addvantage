import Link from "next/link";
import { cn } from "@/lib/cn";
import type { TimelineEvent } from "@/features/timeline/queries/timeline";

function kindBadge(kind: TimelineEvent["kind"]): string {
  switch (kind) {
    case "news":
      return "bg-lime/15 text-lime";
    case "tweet":
      return "bg-amber-400/15 text-amber-400";
    case "macro":
      return "bg-blood/15 text-blood";
    case "earnings":
      return "bg-cyan-400/15 text-cyan-400";
    case "user_pin":
      return "bg-paper/15 text-paper/70";
  }
}

function formatTime(iso: string): string {
  return iso.slice(0, 16).replace("T", " ");
}

export function eventHref(e: TimelineEvent): string | null {
  if (e.news_item_id) return `/app/news/${e.news_item_id}`;
  return e.url ?? null;
}

export function EventCard({
  event,
  className,
}: {
  event: TimelineEvent;
  className?: string;
}) {
  const href = eventHref(event);
  const body = (
    <div className={cn("px-4 py-3 hover:bg-ink-3", className)}>
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
          <span className="font-mono text-[9px] uppercase tracking-widest2 text-lime">
            [{event.source_code}]
          </span>
        )}
        <span className="ml-auto font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
          {formatTime(event.occurred_at)}
        </span>
      </div>
      <div className="mt-1.5 text-sm leading-snug text-paper">{event.title}</div>
    </div>
  );
  if (!href) return body;
  return (
    <Link href={href} className="block">
      {body}
    </Link>
  );
}
