"use client";

import { memo } from "react";
import Link from "next/link";
import {
  DataLabel,
  ImpactPill,
  BiasBadge,
} from "@/components/ui/Marker";
import { Highlight } from "@/components/ui/Highlight";
import { formatTime, cn } from "@/lib/cn";
import type { NewsListItem } from "@/features/news/queries/news";

interface NewsListRowProps {
  item: NewsListItem;
  query: string;
  isSeen: boolean;
}

function NewsListRowImpl({ item, query, isSeen }: NewsListRowProps) {
  const ts = item.publishedAt ?? item.fetchedAt;
  return (
    <Link
      href={`/app/news/${item.id}`}
      className={cn(
        "group grid grid-cols-12 gap-3 bg-black p-4 transition-all hover:-translate-y-px hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none sm:gap-6 sm:p-6",
        isSeen && "opacity-60 hover:opacity-100"
      )}
    >
      <div className="col-span-12 lg:col-span-2">
        <div className="flex items-center gap-2">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
            [{item.sourceCode}]
          </div>
          {isSeen && (
            <span className="font-mono text-[8px] uppercase tracking-widest2 text-white/40">
              ✓ SEEN
            </span>
          )}
        </div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
          {formatTime(ts)}Z
        </div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-brand">
          BY <Highlight text={item.author.toUpperCase()} query={query.toUpperCase()} />
        </div>
        <div className="mt-3 space-y-1.5">
          <ImpactPill level={item.impact} />
          <div>
            <BiasBadge bias={item.bias} />
          </div>
        </div>
      </div>
      <div className="col-span-12 lg:col-span-10">
        <h3
          className={cn(
            "font-display text-2xl leading-snug transition-colors group-hover:text-brand",
            isSeen ? "text-white/70" : "text-white"
          )}
        >
          <Highlight text={item.headline} query={query} />
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-white/80">
          <Highlight text={item.analysis} query={query} />
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <DataLabel>Affects</DataLabel>
          {item.affects.map((a) => (
            <span
              key={a}
              className="border border-white/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/70"
            >
              <Highlight text={a} query={query} />
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export const NewsListRow = memo(NewsListRowImpl);
