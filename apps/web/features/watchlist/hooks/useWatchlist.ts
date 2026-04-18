"use client";

import { usePersistedStringSet } from "@/lib/hooks/usePersistedStringSet";

const KEY = "ants-domain-watchlist";
const EVENT = "ants:watchlist-updated";

/**
 * Hook for the operator's watchlist — a set of instrument tickers
 * they want to monitor. Persisted to localStorage, reactive across
 * components via a custom event. Thin wrapper over usePersistedStringSet.
 */
export function useWatchlist() {
  const { values, hydrated, has, add, remove, toggle, clear } =
    usePersistedStringSet(KEY, EVENT);
  return { tickers: values, hydrated, has, add, remove, toggle, clear };
}
