"use client";

import Link from "next/link";
import { ImpactPill, BiasBadge } from "@/components/ui/Marker";

interface NewsItem {
  id: string;
  sourceCode: string;
  headline: string;
  impact: string;
  bias: string;
  publishedAt: string | null;
  fetchedAt: string;
}

interface NewsListProps {
  items: NewsItem[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NewsList({ items }: NewsListProps) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-white/20">
        No related news yet.
      </p>
    );
  }

  return (
    <div className="divide-y divide-white/[0.04]">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/app/news`}
          className="flex items-start gap-3 px-1 py-3 transition-colors hover:bg-white/[0.02]"
        >
          <span className="mt-0.5 shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] font-bold text-brand">
            {item.sourceCode}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-white/70">{item.headline}</p>
            <div className="mt-1 flex items-center gap-2">
              <ImpactPill level={item.impact as "high" | "medium" | "low"} />
              <BiasBadge bias={item.bias as "bullish" | "bearish" | "neutral"} />
              <span className="text-[10px] text-white/25">
                {timeAgo(item.publishedAt ?? item.fetchedAt)}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
