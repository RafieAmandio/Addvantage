"use client";

import { useWatchlist } from "@/features/watchlist/hooks/useWatchlist";
import { useToast } from "@/lib/toast";
import { cn } from "@/lib/cn";

export function WatchPin({
  ticker,
  className,
  size = "sm",
}: {
  ticker: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const { has, toggle, hydrated } = useWatchlist();
  const toast = useToast();
  const pinned = hydrated && has(ticker);

  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(ticker);
    toast.push({
      tone: pinned ? "info" : "success",
      title: pinned ? "Unpinned" : "Pinned",
      description: `${ticker} ${pinned ? "removed from" : "added to"} your watchlist.`,
      duration: 2000,
    });
  };

  return (
    <button
      onClick={handle}
      title={pinned ? `Unpin ${ticker}` : `Pin ${ticker} to watchlist`}
      aria-label={pinned ? `Unpin ${ticker}` : `Pin ${ticker}`}
      aria-pressed={pinned}
      className={cn(
        "inline-flex items-center justify-center border transition-colors",
        size === "sm" ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-xs",
        pinned
          ? "border-brand bg-brand/10 text-brand hover:border-blood hover:bg-blood/10 hover:text-red-500"
          : "border-white/20 text-white/40 hover:border-brand hover:text-brand",
        className
      )}
    >
      {pinned ? "★" : "☆"}
    </button>
  );
}
