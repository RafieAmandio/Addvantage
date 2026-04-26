import Link from "next/link";
import { SectionNumber, DataLabel, ImpactPill, BiasBadge } from "@/components/ui/Marker";
import { formatTime } from "@/lib/cn";
import type { TimelineEvent } from "@/features/timeline/types";
import type { NewsListItem } from "@/features/news/queries/news";
import { RelatedNewsList } from "@/features/calendar/components/RelatedNewsList";

export function EventDetailView({
  event,
  news,
}: {
  event: TimelineEvent;
  news: NewsListItem[];
}) {
  return (
    <div className="stagger bg-grid-fine">
      <div className="border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-center gap-3">
            <Link
              href="/app/calendar"
              className="font-mono text-[10px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              ← Calendar
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-white/30">
              /
            </span>
            <DataLabel>
              {event.kind.toUpperCase()} · {formatTime(event.occurred_at)}Z
            </DataLabel>
          </div>
          <h1 className="mt-3 font-display text-4xl leading-tight text-white">
            {event.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {event.impact && <ImpactPill level={event.impact} />}
            {event.bias && <BiasBadge bias={event.bias} />}
            {event.symbols.length > 0 && (
              <>
                <DataLabel>Symbols</DataLabel>
                {event.symbols.map((s) => (
                  <span
                    key={s}
                    className="border border-white/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/70"
                  >
                    {s}
                  </span>
                ))}
              </>
            )}
          </div>
          {event.body && (
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/80">
              {event.body}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6">
          <SectionNumber
            n="01 /"
            label={`RELATED NEWS — ${news.length} ${news.length === 1 ? "ITEM" : "ITEMS"}`}
          />
        </div>
        <RelatedNewsList news={news} />
      </div>
    </div>
  );
}
