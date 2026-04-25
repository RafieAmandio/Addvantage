import Link from "next/link";
import { DataLabel, ImpactPill, BiasBadge } from "@/components/ui/Marker";
import { formatTime } from "@/lib/cn";
import type { NewsListItem } from "@/features/news/queries/news";

/**
 * Renders the `listNewsForEvent` result as a list of deeplinks to
 * `/app/news/[id]`. Visual is a trimmed variant of `NewsListClient`'s row:
 * source code, timestamp, impact/bias badges, headline, affects chips.
 * Empty-state copy tells the user *why* there's nothing — the ±2h window,
 * not "no news today".
 */
export function RelatedNewsList({ news }: { news: NewsListItem[] }) {
  if (news.length === 0) {
    return (
      <div className="border border-gray-3 bg-gray-2/40 p-8 text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
          ● NO RELATED NEWS
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
          No approved news items in the ±2h window overlapping this event.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-px bg-gray-3">
      {news.map((n) => {
        const ts = n.published_at ?? n.fetched_at;
        return (
          <Link
            key={n.id}
            href={`/app/news/${n.id}`}
            className="group grid grid-cols-12 gap-6 bg-black p-5 transition-colors hover:bg-gray-2"
          >
            <div className="col-span-12 lg:col-span-3">
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                [{n.source_code}]
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                {formatTime(ts)}Z
              </div>
              <div className="mt-3 space-y-1.5">
                <ImpactPill level={n.impact} />
                <div>
                  <BiasBadge bias={n.bias} />
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-9">
              <h3 className="font-display text-xl leading-snug text-white transition-colors group-hover:text-brand">
                {n.headline}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                {n.analysis}
              </p>
              {n.affects.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <DataLabel>Affects</DataLabel>
                  {n.affects.map((a) => (
                    <span
                      key={a}
                      className="border border-white/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/70"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
