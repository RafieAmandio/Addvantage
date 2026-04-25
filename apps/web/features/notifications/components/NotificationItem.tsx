"use client";

import Link from "next/link";
import { cn, formatDate, formatTime } from "@/lib/cn";
import type { MockNotification } from "@/features/notifications/mock";
import {
  KIND_COLOR,
  KIND_LABEL,
  type BucketId,
} from "@/features/notifications/lib/filters";

interface Props {
  n: MockNotification;
  idx: number;
  isRead: boolean;
  isActive: boolean;
  pinMatch: string | null;
  onToggleRead: () => void;
  onNavigate: () => void;
  className?: string;
}

export function NotificationItem({
  n,
  idx,
  isRead,
  isActive,
  pinMatch,
  onToggleRead,
  onNavigate,
  className,
}: Props) {
  return (
    <div
      data-notif-idx={idx}
      className={cn(
        "group relative",
        isActive && "outline outline-1 outline-lime -outline-offset-1",
        className
      )}
    >
      {/* Toggle — always visible on touch (coarse pointer),
          hover-gated on mouse/fine-pointer devices. */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleRead();
        }}
        aria-label={isRead ? "Mark as unread" : "Mark as read"}
        title={isRead ? "Mark as unread" : "Mark as read"}
        className="absolute right-2 top-2 z-10 border border-gray-3 bg-gray-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/40 transition-opacity hover:border-brand hover:text-brand opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
      >
        {isRead ? "↶ UNREAD" : "✓ READ"}
      </button>
      <Link
        href={n.href}
        onClick={onNavigate}
        className={cn(
          "group block border-b border-gray-3 px-4 py-3 transition-colors last:border-b-0",
          pinMatch && !isRead
            ? "border-l-2 border-l-lime bg-lime/5 hover:bg-brand/10"
            : isRead
              ? "bg-ink hover:bg-gray-2"
              : "bg-gray-2/40 hover:bg-gray-2"
        )}
      >
        <div className="flex items-start gap-3 pr-16">
          <div className="mt-1 shrink-0">
            {!isRead && (
              <span
                className="block h-2 w-2 rounded-full bg-lime shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                aria-label="Unread"
              />
            )}
            {isRead && (
              <span className="block h-2 w-2 rounded-full border border-paper/20" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span
                className={cn(
                  "font-mono text-[9px] uppercase tracking-widest2",
                  KIND_COLOR[n.kind]
                )}
              >
                ● {KIND_LABEL[n.kind]}
              </span>
              {pinMatch && (
                <span className="inline-flex items-center border border-lime bg-lime/10 px-1 py-0 font-mono text-[8px] uppercase tracking-widest2 text-lime">
                  ★ PIN · {pinMatch}
                </span>
              )}
              <span className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                · {n.id} · {formatDate(n.ts)} · {formatTime(n.ts)}Z
              </span>
            </div>
            <div
              className={cn(
                "mt-1 font-display text-base leading-snug",
                isRead ? "text-paper/60" : "text-paper group-hover:text-brand"
              )}
            >
              {n.title}
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-paper/60">{n.body}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}

export function BucketLabel({ bucket }: { bucket: BucketId }) {
  const meta =
    bucket === 0
      ? {
          label: "★ ON YOUR WATCHLIST",
          color: "text-lime",
          border: "border-lime/40",
        }
      : bucket === 1
        ? { label: "● UNREAD", color: "text-paper/60", border: "border-gray-3" }
        : { label: "○ READ", color: "text-paper/30", border: "border-gray-3" };
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b bg-gray-2/40 px-4 py-1.5",
        meta.border
      )}
    >
      <span
        className={cn(
          "font-mono text-[9px] uppercase tracking-widest2",
          meta.color
        )}
      >
        {meta.label}
      </span>
      <span className="h-px flex-1 bg-gray-3" />
    </div>
  );
}
