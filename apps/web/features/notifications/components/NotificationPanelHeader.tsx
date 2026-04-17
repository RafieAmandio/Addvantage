"use client";

import { cn } from "@/lib/cn";

interface Props {
  unreadCount: number;
  onMarkAllRead: () => void;
  className?: string;
}

export function NotificationPanelHeader({
  unreadCount,
  onMarkAllRead,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-ink-3 bg-ink-2/80 px-4 py-3",
        className
      )}
    >
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
          ● TRANSMISSION INBOX
        </div>
        <div className="font-display text-base text-paper">
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </div>
      </div>
      <button
        onClick={onMarkAllRead}
        disabled={unreadCount === 0}
        className={cn(
          "border px-2 py-1 font-mono text-[9px] uppercase tracking-widest2",
          unreadCount === 0
            ? "cursor-default border-ink-3 text-paper/30"
            : "border-lime/60 text-lime hover:bg-lime hover:text-ink"
        )}
      >
        Mark all read
      </button>
    </div>
  );
}
