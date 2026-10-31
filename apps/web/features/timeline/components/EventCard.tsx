import { memo } from "react";
import Link from "next/link";
import { cn, formatWibDateTime } from "@/lib/cn";
import { kindBadge } from "@/features/timeline/types";
import type { TimelineEvent } from "@/features/timeline/queries/timeline";

function eventHref(e: TimelineEvent): string | null {
  if (e.newsItemId) return `/app/news/${e.newsItemId}`;
  return e.url ?? null;
}

function EventCardInner({ event, className }: { event: TimelineEvent; className?: string }) {
  const href = eventHref(event);
  const body = (
    <div className={cn("rounded-lg px-2 py-2.5 transition-colors hover:bg-raised", className)}>
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
        <span className={kindBadge(event.kind)}>{event.kind.replace("_", " ")}</span>
        {event.sourceCode && (
          <>
            <span className="px-1.5 text-white/20">/</span>
            {event.sourceCode}
          </>
        )}
        <span className="float-right font-medium normal-case tracking-normal text-white/40">{formatWibDateTime(event.occurredAt)}</span>
      </p>
      <div className="mt-1 text-[14px] leading-[20px] text-white">{event.title}</div>
    </div>
  );
  if (!href) return body;
  return (
    <Link href={href} className="block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand">
      {body}
    </Link>
  );
}

export const EventCard = memo(EventCardInner);
