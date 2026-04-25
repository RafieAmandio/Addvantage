import type { NotificationKind, MockNotification } from "@/features/notifications/mock";

/**
 * Check if a notification mentions any of the user's pinned tickers.
 * Matches against the title and body text.
 */
export function notificationMatchesPin(
  n: MockNotification,
  tickers: string[]
): string | null {
  if (tickers.length === 0) return null;
  const haystack = `${n.title} ${n.body}`.toUpperCase();
  for (const t of tickers) {
    // Use word-boundary-ish matching so "TSM" doesn't match "TSMC"
    const re = new RegExp(`\\b${t.toUpperCase()}\\b`);
    if (re.test(haystack)) return t;
  }
  return null;
}

export const KIND_LABEL: Record<NotificationKind, string> = {
  alert: "ALERT",
  plan: "PLAN",
  consult: "CONSULT",
  education: "EDU",
  system: "SYSTEM",
};

export const KIND_COLOR: Record<NotificationKind, string> = {
  alert: "text-red-500",
  plan: "text-brand",
  consult: "text-moss",
  education: "text-brand",
  system: "text-white/60",
};

export type NotifFilter = "all" | "unread" | NotificationKind;

const FILTER_STORAGE_KEY = "ants-domain-notif-filter";

export const VALID_FILTERS: NotifFilter[] = [
  "all",
  "unread",
  "alert",
  "plan",
  "consult",
  "education",
  "system",
];

export function loadFilter(): NotifFilter {
  if (typeof window === "undefined") return "all";
  try {
    const v = localStorage.getItem(FILTER_STORAGE_KEY);
    if (v && (VALID_FILTERS as string[]).includes(v)) return v as NotifFilter;
  } catch {}
  return "all";
}

export function saveFilter(f: NotifFilter): void {
  try {
    localStorage.setItem(FILTER_STORAGE_KEY, f);
  } catch {}
}

export type BucketId = 0 | 1 | 2;

export interface NotificationWithBucket {
  n: MockNotification;
  idx: number;
  bucket: BucketId;
}

/**
 * Filter + priority-sort notifications.
 * Priority: pinned-unread (0) → unread (1) → read (2). Within each bucket,
 * preserve the source (newest-first) order.
 */
export function buildVisibleNotifications(
  all: MockNotification[],
  filter: NotifFilter,
  readIds: string[],
  tickers: string[],
  hydrated: boolean,
  watchHydrated: boolean
): NotificationWithBucket[] {
  return all
    .filter((n) => {
      if (filter === "all") return true;
      if (filter === "unread") return hydrated && !readIds.includes(n.id);
      return n.kind === filter;
    })
    .map<NotificationWithBucket>((n, idx) => {
      const isRead = hydrated && readIds.includes(n.id);
      const pin =
        watchHydrated && !isRead ? notificationMatchesPin(n, tickers) : null;
      const bucket: BucketId = pin ? 0 : isRead ? 2 : 1;
      return { n, idx, bucket };
    })
    .sort((a, b) => a.bucket - b.bucket || a.idx - b.idx);
}
