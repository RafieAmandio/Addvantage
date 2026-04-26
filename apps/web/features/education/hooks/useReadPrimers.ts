"use client";

import { usePersistedStringSet } from "@/lib/hooks/usePersistedStringSet";

const KEY = "ants-domain-read-primers";
const EVENT = "ants:read-primers-updated";

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
