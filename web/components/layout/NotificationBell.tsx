"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { notifications } from "@/lib/mock/notifications";
import type { NotificationKind, MockNotification } from "@/lib/mock/notifications";
import { useReadNotifications } from "@/lib/notifications";
import { useWatchlist } from "@/lib/watchlist";
import { useToast } from "@/lib/toast";
import { formatTime, formatDate, cn } from "@/lib/cn";

/**
 * Check if a notification mentions any of the user's pinned tickers.
 * Matches against the title and body text.
 */
function notificationMatchesPin(n: MockNotification, tickers: string[]): string | null {
  if (tickers.length === 0) return null;
  const haystack = `${n.title} ${n.body}`.toUpperCase();
  for (const t of tickers) {
    // Use word-boundary-ish matching so "TSM" doesn't match "TSMC"
    const re = new RegExp(`\\b${t.toUpperCase()}\\b`);
    if (re.test(haystack)) return t;
  }
  return null;
}

const KIND_LABEL: Record<NotificationKind, string> = {
  alert: "ALERT",
  plan: "PLAN",
  consult: "CONSULT",
  education: "EDU",
  system: "SYSTEM",
};

const KIND_COLOR: Record<NotificationKind, string> = {
  alert: "text-blood",
  plan: "text-amber",
  consult: "text-moss",
  education: "text-amber",
  system: "text-paper/60",
};

type NotifFilter = "all" | "unread" | NotificationKind;

const FILTER_STORAGE_KEY = "ants-domain-notif-filter";

const VALID_FILTERS: NotifFilter[] = [
  "all",
  "unread",
  "alert",
  "plan",
  "consult",
  "education",
  "system",
];

function loadFilter(): NotifFilter {
  if (typeof window === "undefined") return "all";
  try {
    const v = localStorage.getItem(FILTER_STORAGE_KEY);
    if (v && (VALID_FILTERS as string[]).includes(v)) return v as NotifFilter;
  } catch {}
  return "all";
}

export function NotificationBell() {
  const { readIds, hydrated, markRead, markUnread, markAllRead, restore } =
    useReadNotifications();
  const { tickers, hydrated: watchHydrated } = useWatchlist();
  const toast = useToast();
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(0);

  const markAllReadWithUndo = () => {
    const snapshot = [...readIds];
    const countBefore = notifications.filter(
      (n) => !readIds.includes(n.id)
    ).length;
    markAllRead(notifications.map((n) => n.id));
    if (countBefore === 0) return;
    toast.push({
      tone: "info",
      title: `${countBefore} notification${countBefore === 1 ? "" : "s"} marked read`,
      description: "Reverse it before this toast expires.",
      duration: 5000,
      action: {
        label: "↶ UNDO",
        onClick: () => restore(snapshot),
      },
    });
  };
  const [open, setOpen] = useState(false);
  const [filter, setFilterState] = useState<NotifFilter>("all");
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Hydrate filter from localStorage once
  useEffect(() => {
    setFilterState(loadFilter());
  }, []);

  const setFilter = (f: NotifFilter) => {
    setFilterState(f);
    try {
      localStorage.setItem(FILTER_STORAGE_KEY, f);
    } catch {}
  };

  const unreadCount = hydrated
    ? notifications.filter((n) => !readIds.includes(n.id)).length
    : 0;

  const visibleWithBucket = notifications
    .filter((n) => {
      if (filter === "all") return true;
      if (filter === "unread") return hydrated && !readIds.includes(n.id);
      return n.kind === filter;
    })
    // Priority sort: pinned-unread → unread → read. Within each bucket,
    // preserve the source (newest-first) order.
    .map((n, idx) => {
      const isRead = hydrated && readIds.includes(n.id);
      const pin =
        watchHydrated && !isRead
          ? notificationMatchesPin(n, tickers)
          : null;
      const bucket: 0 | 1 | 2 = pin ? 0 : isRead ? 2 : 1;
      return { n, idx, bucket };
    })
    .sort((a, b) => a.bucket - b.bucket || a.idx - b.idx);
  const visible = visibleWithBucket.map(({ n }) => n);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        panelRef.current?.contains(t) ||
        buttonRef.current?.contains(t)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keyboard navigation inside the panel
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(visible.length - 1, i + 1));
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        const target = visible[activeIdx];
        if (target) {
          e.preventDefault();
          markRead(target.id);
          setOpen(false);
          router.push(target.href);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, activeIdx, visible, markRead, router]);

  // Reset active index when the panel opens or the visible list changes
  useEffect(() => {
    if (open) setActiveIdx(0);
  }, [open, filter]);

  // Scroll the active row into view inside the panel's scroll container
  useEffect(() => {
    if (!open) return;
    const el = panelRef.current?.querySelector<HTMLElement>(
      `[data-notif-idx="${activeIdx}"]`
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIdx, open]);

  // Listen for global `n` shortcut from Shortcuts.tsx
  useEffect(() => {
    const onToggle = () => setOpen((o) => !o);
    window.addEventListener("ants:bell-toggle", onToggle);
    return () => window.removeEventListener("ants:bell-toggle", onToggle);
  }, []);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={open}
        className={cn(
          "relative border bg-ink-2 px-2.5 py-1.5 text-paper/60 transition-colors hover:border-amber hover:text-amber",
          open ? "border-amber text-amber" : "border-ink-3"
        )}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-4 min-w-[16px] animate-pulse-once items-center justify-center bg-blood px-1 font-mono text-[9px] font-semibold leading-none text-paper shadow-[0_0_10px_rgba(220,38,38,0.6)]"
            aria-hidden
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,420px)] border border-amber bg-ink-2 shadow-[0_0_60px_rgba(245,158,11,0.18)]"
        >
          <div className="classification-stripe h-1" />

          <div className="flex items-center justify-between border-b border-ink-3 bg-ink-2/80 px-4 py-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-amber">
                ● TRANSMISSION INBOX
              </div>
              <div className="font-display text-base text-paper">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "All caught up"}
              </div>
            </div>
            <button
              onClick={markAllReadWithUndo}
              disabled={unreadCount === 0}
              className={cn(
                "border px-2 py-1 font-mono text-[9px] uppercase tracking-widest2",
                unreadCount === 0
                  ? "cursor-default border-ink-3 text-paper/30"
                  : "border-amber/60 text-amber hover:bg-amber hover:text-ink"
              )}
            >
              Mark all read
            </button>
          </div>

          {/* Filter pill row */}
          <div className="flex flex-wrap gap-px overflow-x-auto border-b border-ink-3 bg-ink-2/60 p-2">
            {(
              [
                { v: "all", label: "All" },
                { v: "unread", label: `Unread · ${unreadCount}` },
                { v: "alert", label: "Alert" },
                { v: "plan", label: "Plan" },
                { v: "consult", label: "Consult" },
                { v: "education", label: "Edu" },
                { v: "system", label: "System" },
              ] as Array<{ v: NotifFilter; label: string }>
            ).map((f) => (
              <button
                key={f.v}
                onClick={() => setFilter(f.v)}
                className={cn(
                  "whitespace-nowrap px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest2 transition-colors",
                  filter === f.v
                    ? "bg-amber text-ink"
                    : "bg-ink text-paper/60 hover:text-paper"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            {visible.length === 0 && (
              <div className="p-8 text-center">
                <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                  ● NOTHING IN THIS FILTER
                </div>
                <button
                  onClick={() => setFilter("all")}
                  className="mt-3 border border-amber/60 px-3 py-1 font-mono text-[9px] uppercase tracking-widest2 text-amber hover:bg-amber hover:text-ink"
                >
                  ← Show all
                </button>
              </div>
            )}
            {visibleWithBucket.map(({ n, bucket }, i) => {
              const isRead = hydrated && readIds.includes(n.id);
              const pinMatch =
                watchHydrated ? notificationMatchesPin(n, tickers) : null;
              const prevBucket =
                i > 0 ? visibleWithBucket[i - 1].bucket : -1;
              const bucketChanged = bucket !== prevBucket;
              const isActive = i === activeIdx;
              return (
                <div
                  key={n.id}
                  data-notif-idx={i}
                  className={cn(
                    "group relative",
                    isActive && "outline outline-1 outline-amber -outline-offset-1"
                  )}
                >
                  {bucketChanged && (
                    <BucketLabel bucket={bucket} />
                  )}
                  {/* Toggle — always visible on touch (coarse pointer),
                      hover-gated on mouse/fine-pointer devices. */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isRead) {
                        markUnread(n.id);
                      } else {
                        markRead(n.id);
                      }
                    }}
                    aria-label={isRead ? "Mark as unread" : "Mark as read"}
                    title={isRead ? "Mark as unread" : "Mark as read"}
                    className="absolute right-2 top-2 z-10 border border-ink-3 bg-ink-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/40 transition-opacity hover:border-amber hover:text-amber opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
                  >
                    {isRead ? "↶ UNREAD" : "✓ READ"}
                  </button>
                  <Link
                    href={n.href}
                    onClick={() => {
                      markRead(n.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "group block border-b border-ink-3 px-4 py-3 transition-colors last:border-b-0",
                      pinMatch && !isRead
                        ? "border-l-2 border-l-amber bg-amber/5 hover:bg-amber/10"
                        : isRead
                        ? "bg-ink hover:bg-ink-2"
                        : "bg-ink-2/40 hover:bg-ink-2"
                    )}
                  >
                  <div className="flex items-start gap-3 pr-16">
                    <div className="mt-1 shrink-0">
                      {!isRead && (
                        <span
                          className="block h-2 w-2 rounded-full bg-amber shadow-[0_0_8px_rgba(245,158,11,0.6)]"
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
                          <span className="inline-flex items-center border border-amber bg-amber/10 px-1 py-0 font-mono text-[8px] uppercase tracking-widest2 text-amber">
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
                          isRead
                            ? "text-paper/60"
                            : "text-paper group-hover:text-amber"
                        )}
                      >
                        {n.title}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-paper/60">
                        {n.body}
                      </p>
                    </div>
                  </div>
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="border-t border-ink-3 bg-ink-2/60 px-4 py-2 text-center font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
            ● {visible.length} / {notifications.length} · ↑↓ NAV · ↵ OPEN · ESC / N
          </div>
        </div>
      )}
    </div>
  );
}

function BucketLabel({ bucket }: { bucket: 0 | 1 | 2 }) {
  const meta =
    bucket === 0
      ? { label: "★ ON YOUR WATCHLIST", color: "text-amber", border: "border-amber/40" }
      : bucket === 1
      ? { label: "● UNREAD", color: "text-paper/60", border: "border-ink-3" }
      : { label: "○ READ", color: "text-paper/30", border: "border-ink-3" };
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b bg-ink-2/40 px-4 py-1.5",
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
      <span className="h-px flex-1 bg-ink-3" />
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden
    >
      <path d="M7 1.4v.8" strokeLinecap="round" />
      <path d="M3 6a4 4 0 0 1 8 0v3l1.2 1.6H1.8L3 9V6Z" strokeLinejoin="round" />
      <path d="M5.5 11.4a1.5 1.5 0 0 0 3 0" strokeLinecap="round" />
    </svg>
  );
}
