"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "ants-domain-watchlist";
const EVENT = "ants:watchlist-updated";

function load(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((x) => typeof x === "string");
      }
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
 * Hook for the operator's watchlist — a set of instrument tickers
 * they want to monitor. Persisted to localStorage, reactive across
 * components via a custom event.
 */
export function useWatchlist() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTickers(load());
    setHydrated(true);
    const onUpdate = (e: Event) => {
      const ce = e as CustomEvent<string[]>;
      if (Array.isArray(ce.detail)) setTickers(ce.detail);
    };
    window.addEventListener(EVENT, onUpdate);
    return () => window.removeEventListener(EVENT, onUpdate);
  }, []);

  const toggle = useCallback((ticker: string) => {
    setTickers((prev) => {
      const next = prev.includes(ticker)
        ? prev.filter((t) => t !== ticker)
        : [...prev, ticker];
      save(next);
      window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
      return next;
    });
  }, []);

  const add = useCallback((ticker: string) => {
    setTickers((prev) => {
      if (prev.includes(ticker)) return prev;
      const next = [...prev, ticker];
      save(next);
      window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
      return next;
    });
  }, []);

  const remove = useCallback((ticker: string) => {
    setTickers((prev) => {
      if (!prev.includes(ticker)) return prev;
      const next = prev.filter((t) => t !== ticker);
      save(next);
      window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setTickers([]);
    save([]);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: [] }));
  }, []);

  return {
    tickers,
    hydrated,
    has: (t: string) => tickers.includes(t),
    toggle,
    add,
    remove,
    clear,
  };
}
