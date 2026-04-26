"use client";

import { usePersistedStringSet } from "@/lib/hooks/usePersistedStringSet";

const KEY = "ants-domain-watchlist";
const EVENT = "ants:watchlist-updated";

export function useWatchlist() {
  const { values, hydrated, has, add, remove, toggle, clear } =
    usePersistedStringSet(KEY, EVENT);
  return { tickers: values, hydrated, has, add, remove, toggle, clear };
}
