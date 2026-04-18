"use client";

import { usePersistedStringSet } from "@/lib/hooks/usePersistedStringSet";

const KEY = "ants-domain-read-primers";
const EVENT = "ants:read-primers-updated";

/**
 * Reactive hook for the read-primer set. All instances in the same tab
 * stay in sync via a custom event dispatched on each write.
 * Thin wrapper over usePersistedStringSet.
 */
export function useReadPrimers() {
  const { values, hydrated, add, remove, clear, restore } =
    usePersistedStringSet(KEY, EVENT);
  return {
    ids: values,
    hydrated,
    markRead: add,
    markUnread: remove,
    restore,
    reset: clear,
  };
}
