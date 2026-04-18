"use client";

import { usePersistedStringSet } from "@/lib/hooks/usePersistedStringSet";

const KEY = "ants-domain-seen-news";
const EVENT = "ants:seen-news-updated";

/**
 * Hook for the "seen news" set — tracks which news detail pages the
 * operator has opened. Used in the news listing to visually demote items
 * that have already been read. Thin wrapper over usePersistedStringSet.
 */
export function useSeenNews() {
  const { values, hydrated, add, clear } = usePersistedStringSet(KEY, EVENT);
  return { ids: values, hydrated, markSeen: add, reset: clear };
}
