"use client";

import { memo } from "react";
import Link from "next/link";
import { Highlight } from "@/components/ui/Highlight";
import { formatWibTime, cn } from "@/lib/cn";
import type { NewsListItem } from "@/features/news/queries/news";

interface NewsListRowProps {
  item: NewsListItem;
  query: string;
  isSeen: boolean;
}

/** Eyebrow, headline, two lines of analysis, affected tickers; bias at the end. */
function NewsListRowImpl({ item, query, isSeen }: NewsListRowProps) {
  const ts = item.publishedAt ?? item.fetchedAt;
  return (
    <Link
      href={`/app/news/${item.id}`}
      className="group flex gap-4 py-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
          {item.sourceCode}
          <span className="px-1.5 text-white/20">/</span>
          {formatWibTime(ts)} WIB
          <span className="hidden sm:inline">
            <span className="px-1.5 text-white/20">/</span>
            <Highlight text={item.author} query={query} />
          </span>
          {item.impact === "high" && <span className="ml-2 text-brand">High impact</span>}
          {item.impact === "medium" && <span className="ml-2 text-white/55">Medium</span>}
          {item.bias !== "neutral" && (
            <span className={cn("ml-2 sm:hidden", item.bias === "bullish" ? "text-up" : "text-down")}>{item.bias === "bullish" ? "▲ Bull" : "▼ Bear"}</span>
          )}
          {isSeen && <span className="ml-2 font-medium normal-case tracking-normal text-white/30">· seen</span>}
        </p>
        <h3 className={cn("mt-1 text-[17px] font-medium leading-6 transition-colors group-hover:text-white", isSeen ? "text-white/55" : "text-white")}>
          <Highlight text={item.headline} query={query} />
        </h3>
        <p className="mt-1 line-clamp-2 text-[14px] leading-[21px] text-white/55">
          <Highlight text={item.analysis} query={query} />
        </p>
        {item.affects.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.affects.map((a) => (
              <span key={a} className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] font-medium text-white/60">
                <Highlight text={a} query={query} />
              </span>
            ))}
          </div>
        )}
      </div>
      {item.bias !== "neutral" && (
        <span className={cn("hidden shrink-0 self-center text-[12px] sm:block font-semibold uppercase tracking-[0.06em]", item.bias === "bullish" ? "text-up" : "text-down")}>
          {item.bias === "bullish" ? "▲ Bull" : "▼ Bear"}
        </span>
      )}
    </Link>
  );
}

export const NewsListRow = memo(NewsListRowImpl);
