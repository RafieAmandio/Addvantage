"use client";

import { usePersistedStringSet } from "@/lib/hooks/usePersistedStringSet";

const KEY = "ants-domain-seen-news";
const EVENT = "ants:seen-news-updated";

export function useSeenNews() {
  const { values, hydrated, add, clear } = usePersistedStringSet(KEY, EVENT);
  return { ids: values, hydrated, markSeen: add, reset: clear };
}
