import { useEffect, useState, useCallback } from "react";

const KEY = "ants-domain-read-primers";

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

/**
 * Reactive hook for the read-primer set. All instances in the same tab
 * stay in sync via a custom event we dispatch alongside the write.
 */
export function useReadPrimers() {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIds(load());
    setHydrated(true);
    const onUpdate = (e: Event) => {
      const ce = e as CustomEvent<string[]>;
      if (Array.isArray(ce.detail)) setIds(ce.detail);
    };
    window.addEventListener("ants:read-primers-updated", onUpdate);
    return () => window.removeEventListener("ants:read-primers-updated", onUpdate);
  }, []);

  const markRead = useCallback((id: string) => {
    setIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      save(next);
      window.dispatchEvent(
        new CustomEvent("ants:read-primers-updated", { detail: next })
      );
      return next;
    });
  }, []);

  const markUnread = useCallback((id: string) => {
    setIds((prev) => {
      if (!prev.includes(id)) return prev;
      const next = prev.filter((x) => x !== id);
      save(next);
      window.dispatchEvent(
        new CustomEvent("ants:read-primers-updated", { detail: next })
      );
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setIds([]);
    save([]);
    window.dispatchEvent(
      new CustomEvent("ants:read-primers-updated", { detail: [] })
    );
  }, []);

  /** Overwrite the full read-primer set. Used by undo actions. */
  const restore = useCallback((nextIds: string[]) => {
    const deduped = Array.from(new Set(nextIds));
    setIds(deduped);
    save(deduped);
    window.dispatchEvent(
      new CustomEvent("ants:read-primers-updated", { detail: deduped })
    );
  }, []);

  return { ids, hydrated, markRead, markUnread, restore, reset };
}
