"use client";

import { useEffect, useState } from "react";
import { notifications } from "@/features/notifications/mock";
import { useReadNotifications } from "@/features/notifications/notifications";

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
