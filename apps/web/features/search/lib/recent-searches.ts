const RECENT_KEY = "ants-domain-recent-searches";
const MAX_RECENT = 6;

export function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {}
  return [];
}

export function saveRecentSearches(list: string[]): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {}
}

/**
 * Insert `query` at the head of `recent`, de-duplicated and capped at MAX_RECENT.
 * Empty/whitespace-only queries are dropped.
 */
export function pushRecentSearch(recent: string[], query: string): string[] {
  const trimmed = query.trim();
  return [trimmed, ...recent.filter((q) => q !== trimmed)]
    .filter(Boolean)
    .slice(0, MAX_RECENT);
}
