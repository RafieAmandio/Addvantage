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
        "inline-flex shrink-0 items-center justify-center rounded-full leading-none transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
        size === "sm" ? "h-6 w-6 text-[13px]" : "h-7 w-7 text-[15px]",
        pinned ? "text-brand hover:text-white/55" : "text-white/30 hover:text-white",
        className
      )}
    >
      {pinned ? "★" : "☆"}
    </button>
  );
}
