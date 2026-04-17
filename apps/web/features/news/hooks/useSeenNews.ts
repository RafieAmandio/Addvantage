"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "ants-domain-seen-news";
const EVENT = "ants:seen-news-updated";

function load(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
        return parsed.filter((x) => typeof x === "string");
    }
  } catch {}
  return [];
}

function save(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {}
}

/**
 * Hook for the "seen news" set — tracks which news detail pages the
 * operator has opened. Used in the news listing to visually demote items
 * that have already been read. Same sync pattern as useReadPrimers.
 */
export function useSeenNews() {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIds(load());
    setHydrated(true);
    const onUpdate = (e: Event) => {
      const ce = e as CustomEvent<string[]>;
      if (Array.isArray(ce.detail)) setIds(ce.detail);
    };
    window.addEventListener(EVENT, onUpdate);
    return () => window.removeEventListener(EVENT, onUpdate);
  }, []);

  const markSeen = useCallback((id: string) => {
    setIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      save(next);
      window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setIds([]);
    save([]);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: [] }));
  }, []);

  return { ids, hydrated, markSeen, reset };
}
