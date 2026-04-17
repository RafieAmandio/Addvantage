"use client";

import { useEffect, useState } from "react";
import { notifications } from "@/features/notifications/mock";
import { useReadNotifications } from "@/features/notifications/notifications";

/**
 * Reflects the unread notification count in the browser tab title.
 * When the tab is hidden and there are unread items, prefix with a
 * blinking `• ` to catch the operator's eye when they come back.
 * Mounts once in the app layout.
 */
export function DocumentTitle() {
  const { readIds, hydrated } = useReadNotifications();
  const [tabHidden, setTabHidden] = useState(false);

  // Track tab visibility
  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const base = "ANTS · DOMAIN";
    const unreadCount = notifications.filter(
      (n) => !readIds.includes(n.id)
    ).length;

    let title: string;
    if (unreadCount === 0) {
      title = base;
    } else if (tabHidden) {
      // Attention prefix — tab is backgrounded and there's pending info
      title = `• (${unreadCount}) ${base}`;
    } else {
      title = `(${unreadCount}) ${base}`;
    }

    const prev = document.title;
    document.title = title;
    return () => {
      document.title = prev;
    };
  }, [readIds, hydrated, tabHidden]);

  return null;
}
