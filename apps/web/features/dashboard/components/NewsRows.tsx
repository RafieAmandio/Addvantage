import { useMemo } from "react";
import Link from "next/link";
import { ImpactPill, BiasBadge } from "@/components/ui/Marker";
import { formatTime, cn } from "@/lib/cn";
import type { NewsListItem } from "@/features/news/queries/news";

export function NewsRows({
  news,
  seenNewsIds,
  seenHydrated,
}: {
  news: NewsListItem[];
  seenNewsIds: string[];
  seenHydrated: boolean;
}) {
  const highImpactFirst = useMemo(
    () =>
      [...news]
        .sort((a, b) => {
          const rank = { high: 0, medium: 1, low: 2 };
          return rank[a.impact] - rank[b.impact];
        })
        .slice(0, 5),
    [news],
  );

  if (highImpactFirst.length === 0) {
    return (
      <section aria-label="News" className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
          <h2 className="text-xs font-medium text-white/50">News</h2>
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] py-10 text-center">
            <p className="text-sm text-white/50">No news items yet.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Top news">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium text-white/50">
            Top news
          </h2>
          <Link
            href="/app/news"
            className="text-xs text-brand hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            All news
          </Link>
        </div>

        <div className="mt-3">
          {highImpactFirst.map((n, i) => {
            const seen = seenHydrated && seenNewsIds.includes(n.id);
            const ts = n.published_at ?? n.fetched_at;
            return (
              <Link
                key={n.id}
                href={`/app/news/${n.id}`}
                className={cn(
                  "group flex items-center gap-3 border-b border-white/[0.04] py-3.5 transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand sm:gap-4",
                  i === 0 && "border-t border-t-white/[0.04]",
                  seen && "opacity-50 hover:opacity-80",
                )}
              >
                <span className="w-8 shrink-0 text-[11px] font-medium text-brand">
                  {n.source_code}
                </span>
                <ImpactPill level={n.impact} />
                <span className="min-w-0 flex-1 truncate text-sm text-white transition-colors group-hover:text-brand">
                  {n.headline}
                </span>
                <BiasBadge bias={n.bias} />
                <span className="hidden w-16 shrink-0 text-right text-[11px] text-white/40 sm:block">
                  {formatTime(ts)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
