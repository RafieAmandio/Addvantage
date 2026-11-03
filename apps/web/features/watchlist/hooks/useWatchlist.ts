"use client";

import { usePersistedStringSet } from "@/lib/hooks/usePersistedStringSet";
import { isMockMode } from "@/lib/config/public";

const KEY = "ants-domain-watchlist";
const EVENT = "ants:watchlist-updated";

// Demo: a first visit starts with a few pins. Only when the key was never written,
// so clearing the list in demo sticks.
if (isMockMode() && typeof window !== "undefined") {
  try {
    if (localStorage.getItem(KEY) === null) localStorage.setItem(KEY, JSON.stringify(["XAUUSD", "EURUSD", "USDJPY", "GBPUSD", "SPX", "NDX"]));
  } catch {
    /* storage blocked: start empty */
  }
}

export function useWatchlist() {
  const { values, hydrated, has, add, remove, toggle, clear } =
    usePersistedStringSet(KEY, EVENT);
  return { tickers: values, hydrated, has, add, remove, toggle, clear };
}
