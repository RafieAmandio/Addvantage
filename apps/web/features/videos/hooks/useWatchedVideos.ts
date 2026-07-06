"use client";

import { usePersistedStringSet } from "@/lib/hooks/usePersistedStringSet";

const KEY = "ants-domain-watched-videos";
const EVENT = "ants:watched-videos-updated";

export function useWatchedVideos() {
  const { values, hydrated, add } = usePersistedStringSet(KEY, EVENT);
  return {
    slugs: values,
    hydrated,
    markWatched: add,
  };
}
