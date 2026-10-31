"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { Panel, PanelLink } from "@/components/ui/Panel";
import type { NewsListItem } from "@/features/news/queries/news";

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)}m`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h}h` : `${Math.round(h / 24)}d`;
}

/** Latest news as Kalshi-style rows: eyebrow, headline, affected pairs, bias at the end. */
export function NewsPanel({
  news,
  seen,
  title = "Latest news",
  limit = 6,
  children,
}: {
  news: NewsListItem[];
  seen: Set<string>;
  title?: string;
  limit?: number;
  children?: React.ReactNode;
}) {
  const rows = news.slice(0, limit);
  const newest = rows[0]?.publishedAt ?? rows[0]?.fetchedAt;
  const staleDays = newest ? Math.floor((Date.now() - new Date(newest).getTime()) / 86_400_000) : 0;

  return (
    <Panel
      title={title}
      sub={staleDays >= 2 ? <span className="text-down">No new items in {staleDays} days</span> : "Market-moving, with what it means for price"}
      action={<PanelLink href="/app/news">All news</PanelLink>}
    >
      {children}
      {rows.length === 0 ? (
        <p className="py-6 text-[14px] text-white/40">No news yet.</p>
      ) : (
        <ul className="-my-1 divide-y divide-white/[0.07]">
          {rows.map((n) => {
            const at = n.publishedAt ?? n.fetchedAt;
            return (
              <li key={n.id}>
                <Link
                  href={`/app/news/${n.id}`}
                  className="group flex gap-4 py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
                      {n.sourceCode}
                      <span className="px-1.5 text-white/20">/</span>
                      {ago(at)} ago
                      {n.impact === "high" && <span className="ml-2 text-brand">High impact</span>}
                    </p>
                    <p className={cn("mt-0.5 line-clamp-2 text-[15px] leading-[22px] transition-colors group-hover:text-white", seen.has(n.id) ? "text-white/55" : "text-white")}>
                      {n.headline}
                    </p>
                    {n.affects.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {n.affects.slice(0, 4).map((a) => (
                          <span key={a} className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] font-medium text-white/60">
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {n.bias !== "neutral" && (
                    <span className={cn("shrink-0 self-center text-[12px] font-semibold uppercase tracking-[0.06em]", n.bias === "bullish" ? "text-up" : "text-down")}>
                      {n.bias === "bullish" ? "▲ Bull" : "▼ Bear"}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
