import { news } from "@/features/news/mock";
import { primers } from "@/features/education/mock";
import { channelPosts } from "@/features/channel/mock";
import { consultSessions } from "@/features/consult/mock";
import { allHashtags, hashtagMeta } from "@/features/tags/mock";
import { tradingPlans } from "@/features/plan/mock";
import type { ConsultMessage } from "@/lib/mock/types";
import { logger } from "@/lib/logger";

export type ResultKind =
  | "news"
  | "primer"
  | "channel"
  | "consult"
  | "hashtag"
  | "plan";

export interface SearchResult {
  kind: ResultKind;
  id: string;
  title: string;
  snippet: string;
  href: string;
  author?: string;
  tags?: string[];
  meta?: string;
  score: number;
}

interface IndexEntry {
  kind: ResultKind;
  id: string;
  title: string;
  snippet: string;
  href: string;
  author?: string;
  tags?: string[];
  meta?: string;
  haystack: string; // lowercased, concatenated searchable text
}

let cachedIndex: IndexEntry[] | null = null;

/**
 * Shape of a locally-persisted consult session. Mirrors what the consult
 * page writes to localStorage under `ants-domain-consult-v1`.
 */
interface LocalConsultSession {
  id: string;
  title: string;
  startedAt: string;
  lastAt: string;
  tags: string[];
  messages: ConsultMessage[];
}

interface PersistedConsult {
  sessions: LocalConsultSession[];
  extras: Record<string, ConsultMessage[]>;
}

/**
 * Read local consult sessions out of localStorage at search time.
 * Returns [] on SSR or when nothing's persisted.
 */
function getLocalConsultEntries(): IndexEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("ants-domain-consult-v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PersistedConsult;
    if (!parsed.sessions || !Array.isArray(parsed.sessions)) return [];

    return parsed.sessions.map((s) => {
      const extras = parsed.extras?.[s.id] ?? [];
      const allMsgs = [...s.messages, ...extras];
      const lastUser = allMsgs
        .filter((m) => m.role === "user")
        .slice(-1)[0]?.body ?? "";
      return {
        kind: "consult" as const,
        id: s.id,
        title: s.title,
        snippet: lastUser.slice(0, 140) + (lastUser.length > 140 ? "…" : ""),
        href: "/app/consult",
        tags: s.tags,
        meta: `${allMsgs.length} messages · local`,
        haystack: [
          s.title,
          s.tags.join(" "),
          allMsgs.map((m) => m.body).join(" "),
          "local",
        ]
          .join(" ")
          .toLowerCase(),
      };
    });
  } catch (error) {
    logger.warn("loadLocalConsultSessions failed", {
      error,
      scope: "search.loadLocalConsultSessions",
    });
    return [];
  }
}

function buildIndex(): IndexEntry[] {
  const entries: IndexEntry[] = [];

  for (const n of news) {
    entries.push({
      kind: "news",
      id: n.id,
      title: n.headline,
      snippet: n.analysis,
      href: `/app/news/${n.id}`,
      author: n.author,
      tags: n.tags,
      meta: `${n.impact.toUpperCase()} · ${n.bias.toUpperCase()}`,
      haystack: [
        n.headline,
        n.analysis,
        n.author,
        n.affects.join(" "),
        n.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase(),
    });
  }

  for (const p of primers) {
    entries.push({
      kind: "primer",
      id: p.id,
      title: p.title,
      snippet: p.summary,
      href: `/app/education/${p.id}`,
      author: p.author,
      tags: p.tags,
      meta: `${p.readingMin} min · ${p.framework}`,
      haystack: [
        p.title,
        p.summary,
        p.body.join(" "),
        p.framework,
        p.author,
        p.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase(),
    });
  }

  for (const c of channelPosts) {
    entries.push({
      kind: "channel",
      id: c.id,
      title: c.body.slice(0, 70) + (c.body.length > 70 ? "…" : ""),
      snippet: c.body,
      href: "/app/channel",
      author: c.author,
      tags: c.tags,
      meta: c.id,
      haystack: [c.body, c.author, c.tags.join(" ")].join(" ").toLowerCase(),
    });
  }

  for (const s of consultSessions) {
    const lastUser =
      s.messages.find((m) => m.role === "user")?.body ?? "";
    entries.push({
      kind: "consult",
      id: s.id,
      title: s.title,
      snippet: lastUser.slice(0, 140) + (lastUser.length > 140 ? "…" : ""),
      href: "/app/consult",
      tags: s.tags,
      meta: `${s.messages.length} messages`,
      haystack: [
        s.title,
        s.tags.join(" "),
        s.messages.map((m) => m.body).join(" "),
      ]
        .join(" ")
        .toLowerCase(),
    });
  }

  for (const t of allHashtags) {
    const m = hashtagMeta[t];
    entries.push({
      kind: "hashtag",
      id: t,
      title: `#${t}`,
      snippet: m.description,
      href: `/app/tags/${t}`,
      meta: m.label,
      haystack: [t, m.label, m.description].join(" ").toLowerCase(),
    });
  }

  for (const p of tradingPlans) {
    entries.push({
      kind: "plan",
      id: p.id,
      title: `Trading Plan · ${p.id}`,
      snippet: p.thesis,
      href: "/app/plan",
      author: p.authoredBy,
      meta: `${p.horizon} · ${p.setups.length} setups`,
      haystack: [
        p.thesis,
        p.authoredBy,
        p.horizon,
        p.setups
          .map((s) => `${s.instrument} ${s.direction} ${s.rationale}`)
          .join(" "),
        p.risks.join(" "),
      ]
        .join(" ")
        .toLowerCase(),
    });
  }

  return entries;
}

function getIndex(): IndexEntry[] {
  if (!cachedIndex) cachedIndex = buildIndex();
  // Local sessions are live (not cached) — read fresh on every search so
  // renames and new messages show up without a page reload.
  return [...getLocalConsultEntries(), ...cachedIndex];
}

/**
 * Score a single entry against tokens. Higher = better.
 * - Title match: 10 per token
 * - Tag exact match: 8 per token
 * - Haystack contains: 3 per token
 * - Bonus: all tokens present anywhere
 */
function score(entry: IndexEntry, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const title = entry.title.toLowerCase();
  const tags = (entry.tags ?? []).map((t) => t.toLowerCase());
  let s = 0;
  let allHit = true;
  for (const tok of tokens) {
    let hit = false;
    if (title.includes(tok)) {
      s += 10;
      hit = true;
    }
    if (tags.some((t) => t === tok || t.includes(tok))) {
      s += 8;
      hit = true;
    }
    if (entry.haystack.includes(tok)) {
      s += 3;
      hit = true;
    }
    if (!hit) allHit = false;
  }
  if (allHit) s += 5;
  return s;
}

export function search(query: string, limit = 30): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  const index = getIndex();
  const scored: SearchResult[] = [];
  for (const entry of index) {
    const sc = score(entry, tokens);
    if (sc > 0) {
      scored.push({
        kind: entry.kind,
        id: entry.id,
        title: entry.title,
        snippet: entry.snippet,
        href: entry.href,
        author: entry.author,
        tags: entry.tags,
        meta: entry.meta,
        score: sc,
      });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

export const KIND_META: Record<
  ResultKind,
  { label: string; code: string; order: number }
> = {
  news: { label: "News", code: "TX-01", order: 1 },
  plan: { label: "Trading Plan", code: "TX-03", order: 2 },
  primer: { label: "Education", code: "TX-05", order: 3 },
  consult: { label: "Consultation", code: "TX-04", order: 4 },
  channel: { label: "My Channel", code: "TX-06", order: 5 },
  hashtag: { label: "Hashtag", code: "—", order: 6 },
};

export function groupResults(results: SearchResult[]) {
  const map = new Map<ResultKind, SearchResult[]>();
  for (const r of results) {
    const list = map.get(r.kind) ?? [];
    list.push(r);
    map.set(r.kind, list);
  }
  return Array.from(map.entries()).sort(
    (a, b) => KIND_META[a[0]].order - KIND_META[b[0]].order
  );
}
