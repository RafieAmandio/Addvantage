"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function usePersistedStringSet(key: string, eventName: string) {
  const [values, setValues] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const keyRef = useRef(key);
  keyRef.current = key;

  useEffect(() => {
    setValues(loadFromStorage(keyRef.current));
    setHydrated(true);
    const onUpdate = (e: Event) => {
      const ce = e as CustomEvent<string[]>;
      if (Array.isArray(ce.detail)) setValues(ce.detail);
    };
    window.addEventListener(eventName, onUpdate);
    return () => window.removeEventListener(eventName, onUpdate);
  }, [eventName]);

  const commit = useCallback(
    (next: string[]) => {
      saveToStorage(keyRef.current, next);
      window.dispatchEvent(new CustomEvent(eventName, { detail: next }));
      return next;
    },
    [eventName],
  );

  const add = useCallback(
    (v: string) => {
      setValues((prev) => (prev.includes(v) ? prev : commit([...prev, v])));
    },
    [commit],
  );

  const remove = useCallback(
    (v: string) => {
      setValues((prev) =>
        prev.includes(v) ? commit(prev.filter((x) => x !== v)) : prev,
      );
    },
    [commit],
  );

  const toggle = useCallback(
    (v: string) => {
      setValues((prev) =>
        commit(prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]),
      );
    },
    [commit],
  );

  const clear = useCallback(() => {
    setValues(commit([]));
  }, [commit]);

  const restore = useCallback(
    (next: string[]) => {
      setValues(commit(Array.from(new Set(next))));
    },
    [commit],
  );

  const has = useCallback((v: string) => values.includes(v), [values]);

  return { values, hydrated, has, add, remove, toggle, clear, restore };
}

function loadFromStorage(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

function saveToStorage(key: string, values: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // Storage full/disabled — degrades to in-memory only.
  }
}
