import { allHashtags } from "@/features/tags/constants";
import type { Hashtag } from "@tradevantage/shared";

const KEY = "ants-domain-recent-visits";
const MAX = 6;

export interface RecentVisit {
  href: string;
  label: string;
  kind: string;
  ts: number;
}

const SURFACE_LABELS: Record<string, { label: string; kind: string }> = {
  "/app": { label: "Home", kind: "Home" },
  "/app/brief": { label: "Today's Brief", kind: "Brief" },
  "/app/news": { label: "Live News", kind: "Feed" },
  "/app/calendar": { label: "Economic Calendar", kind: "Feed" },
  "/app/channel": { label: "My Channel", kind: "Feed" },
  "/app/plan": { label: "Trading Plan", kind: "Plan" },
  "/app/plan/archive": { label: "Plan Archive", kind: "Plan" },
  "/app/plan/compare": { label: "Plan Compare", kind: "Plan" },
  "/app/consult": { label: "1v1 Consultation", kind: "Consult" },
  "/app/education": { label: "Video Modules", kind: "Education" },
  "/app/education/primers": { label: "Education Library", kind: "Education" },
  "/app/tags": { label: "Hashtag Explorer", kind: "Index" },
  "/app/watchlist": { label: "Watchlist", kind: "Account" },
  "/app/subscription": { label: "Subscription", kind: "Account" },
};

function describeRoute(href: string): { label: string; kind: string } | null {
  const [pathname, qs] = href.split("?");

  if (SURFACE_LABELS[pathname]) {
    const base = SURFACE_LABELS[pathname];
    if (pathname === "/app/calendar" && qs) {
      const sp = new URLSearchParams(qs);
      const bits: string[] = [];
      const view = sp.get("view");
      if (view) bits.push(view);
      if (sp.get("impact")) bits.push(sp.get("impact") ?? "");
      if (sp.get("region")) bits.push(sp.get("region") ?? "");
      if (bits.length > 0) {
        return { label: `${base.label} · ${bits.join(" · ")}`, kind: base.kind };
      }
    }
    if (pathname === "/app/plan/compare" && qs) {
      const sp = new URLSearchParams(qs);
      const a = sp.get("a");
      const b = sp.get("b");
      if (a && b) {
        return { label: `Compare · ${a} vs ${b}`, kind: base.kind };
      }
      if (a || b) {
        return { label: `Compare · ${a || b}`, kind: base.kind };
      }
    }
    if (pathname === "/app/plan/archive" && qs) {
      const sp = new URLSearchParams(qs);
      const h = sp.get("h");
      if (h) {
        return { label: `${base.label} · ${h}`, kind: base.kind };
      }
    }
    return base;
  }

  if (/^\/app\/news\/.+$/.test(pathname)) {
    return { label: "News Article", kind: "News" };
  }

  if (/^\/app\/education\/.+$/.test(pathname)) {
    return { label: "Education Primer", kind: "Primer" };
  }

  const tagMatch = pathname.match(/^\/app\/tags\/(.+)$/);
  if (tagMatch && allHashtags.includes(tagMatch[1] as Hashtag)) {
    return {
      label: `#${tagMatch[1]}`,
      kind: "Hashtag",
    };
  }

  return null;
}

export function trackVisit(href: string): void {
  if (typeof window === "undefined") return;
  const desc = describeRoute(href);
  if (!desc) return;

  let list: RecentVisit[] = [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) list = JSON.parse(raw);
  } catch {}

  list = list.filter((v) => v.href !== href);
  list.unshift({ href, label: desc.label, kind: desc.kind, ts: Date.now() });
  list = list.slice(0, MAX);

  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export function getRecentVisits(): RecentVisit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}
