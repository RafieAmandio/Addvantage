"use client";

import { useEffect, useState, useCallback } from "react";

const KEY = "ants-domain-read-notifications";

function load(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
    }
  } catch {}
  return [];
}

function save(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {}
}

const EVENT = "ants:notif-read-updated";

export function useReadNotifications() {
  const [readIds, setReadIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setReadIds(load());
    setHydrated(true);
    const onUpdate = (e: Event) => {
      const ce = e as CustomEvent<string[]>;
      if (Array.isArray(ce.detail)) setReadIds(ce.detail);
    };
    window.addEventListener(EVENT, onUpdate);
    return () => window.removeEventListener(EVENT, onUpdate);
  }, []);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      save(next);
      window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
      return next;
    });
  }, []);

  const markUnread = useCallback((id: string) => {
    setReadIds((prev) => {
      if (!prev.includes(id)) return prev;
      const next = prev.filter((x) => x !== id);
      save(next);
      window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
      return next;
    });
  }, []);

  const markAllRead = useCallback((allIds: string[]) => {
    setReadIds(() => {
      const next = Array.from(new Set(allIds));
      save(next);
      window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
      return next;
    });
  }, []);

  /** Overwrite the full read-state set. Used by undo actions. */
  const restore = useCallback((ids: string[]) => {
    setReadIds(() => {
      const next = Array.from(new Set(ids));
      save(next);
      window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setReadIds([]);
    save([]);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: [] }));
  }, []);

  return {
    readIds,
    hydrated,
    markRead,
    markUnread,
    markAllRead,
    restore,
    reset,
  };
}
