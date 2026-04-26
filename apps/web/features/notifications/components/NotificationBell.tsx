"use client";

import { useEffect, useState } from "react";
import { useReadNotifications } from "@/features/notifications/notifications";
import type { Notification } from "@/features/notifications/types";
import { useWatchlist } from "@/features/watchlist/hooks/useWatchlist";
import { useToast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import {
  buildVisibleNotifications,
  loadFilter,
  notificationMatchesPin,
  saveFilter,
  type NotifFilter,
} from "@/features/notifications/lib/filters";
import { useNotificationBell } from "@/features/notifications/hooks/useNotificationBell";
import { BellIcon } from "./BellIcon";
import { NotificationPanelHeader } from "./NotificationPanelHeader";
import { NotificationFilterTabs } from "./NotificationFilterTabs";
import { NotificationEmpty } from "./NotificationEmpty";
import { BucketLabel, NotificationItem } from "./NotificationItem";

const EMPTY: Notification[] = [];

interface NotificationBellProps {
  notifications?: Notification[];
  className?: string;
}

export function NotificationBell({ notifications = EMPTY, className }: NotificationBellProps) {
  const { readIds, hydrated, markRead, markUnread, markAllRead, restore } =
    useReadNotifications();
  const { tickers, hydrated: watchHydrated } = useWatchlist();
  const toast = useToast();
  const [filter, setFilterState] = useState<NotifFilter>("all");

  useEffect(() => {
    setFilterState(loadFilter());
  }, []);

  const setFilter = (f: NotifFilter) => {
    setFilterState(f);
    saveFilter(f);
  };

  const unreadCount = hydrated
    ? notifications.filter((n) => !readIds.includes(n.id)).length
    : 0;

  const visibleWithBucket = buildVisibleNotifications(
    notifications,
    filter,
    readIds,
    tickers,
    hydrated,
    watchHydrated
  );
  const visible = visibleWithBucket.map(({ n }) => n);

  const { open, setOpen, activeIdx, setActiveIdx, panelRef, buttonRef } =
    useNotificationBell({ visible, markRead });

  useEffect(() => {
    if (open) setActiveIdx(0);
  }, [open, filter, setActiveIdx]);

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

  return (
    <div className={cn("relative", className)}>
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={open}
        className={cn(
          "relative border bg-gray-2 px-2.5 py-1.5 text-white/60 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
          open ? "border-brand text-brand" : "border-gray-3"
        )}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-4 min-w-[16px] animate-pulse-once items-center justify-center bg-blood px-1 font-mono text-[9px] font-semibold leading-none text-white shadow-[0_0_10px_rgba(220,38,38,0.6)]"
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
          className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,420px)] border border-brand bg-gray-2 shadow-[0_0_60px_rgba(245,158,11,0.18)]"
        >
          <div className="classification-stripe h-1" />

          <NotificationPanelHeader
            unreadCount={unreadCount}
            onMarkAllRead={markAllReadWithUndo}
          />

          <NotificationFilterTabs
            filter={filter}
            unreadCount={unreadCount}
            onChange={setFilter}
          />

          <div className="max-h-[50vh] overflow-y-auto">
            {visible.length === 0 && (
              <NotificationEmpty onResetFilter={() => setFilter("all")} />
            )}
            {visibleWithBucket.map(({ n, bucket }, i) => {
              const isRead = hydrated && readIds.includes(n.id);
              const pinMatch = watchHydrated
                ? notificationMatchesPin(n, tickers)
                : null;
              const prevBucket =
                i > 0 ? visibleWithBucket[i - 1].bucket : -1;
              const bucketChanged = bucket !== prevBucket;
              return (
                <div key={n.id}>
                  {bucketChanged && <BucketLabel bucket={bucket} />}
                  <NotificationItem
                    n={n}
                    idx={i}
                    isRead={isRead}
                    isActive={i === activeIdx}
                    pinMatch={pinMatch}
                    onToggleRead={() =>
                      isRead ? markUnread(n.id) : markRead(n.id)
                    }
                    onNavigate={() => {
                      markRead(n.id);
                      setOpen(false);
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-3 bg-gray-2/60 px-4 py-2 text-center font-mono text-[9px] uppercase tracking-widest2 text-white/40">
            ● {visible.length} / {notifications.length} · ↑↓ NAV · ↵ OPEN · ESC / N
          </div>
        </div>
      )}
    </div>
  );
}
