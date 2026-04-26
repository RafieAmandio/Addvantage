import { allHashtags, hashtagMeta } from "@/features/tags/constants";
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

function getLocalConsultResults(tokens: string[]): SearchResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("ants-domain-consult-v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PersistedConsult;
    if (!parsed.sessions || !Array.isArray(parsed.sessions)) return [];

    const results: SearchResult[] = [];
    for (const s of parsed.sessions) {
      const extras = parsed.extras?.[s.id] ?? [];
      const allMsgs = [...s.messages, ...extras];
      const lastUser =
        allMsgs
          .filter((m) => m.role === "user")
          .slice(-1)[0]?.body ?? "";
      const haystack = [
        s.title,
        s.tags.join(" "),
        allMsgs.map((m) => m.body).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      const sc = scoreHaystack(s.title.toLowerCase(), s.tags, haystack, tokens);
      if (sc > 0) {
        results.push({
          kind: "consult",
          id: s.id,
          title: s.title,
          snippet: lastUser.slice(0, 140) + (lastUser.length > 140 ? "…" : ""),
          href: "/app/consult",
          tags: s.tags,
          meta: `${allMsgs.length} messages · local`,
          score: sc,
        });
      }
    }
    return results;
  } catch (error) {
    logger.warn("loadLocalConsultSessions failed", {
      error,
      scope: "search.loadLocalConsultSessions",
    });
    return [];
  }
}

function getHashtagResults(tokens: string[]): SearchResult[] {
  const results: SearchResult[] = [];
  for (const t of allHashtags) {
    const m = hashtagMeta[t];
    const haystack = [t, m.label, m.description].join(" ").toLowerCase();
    const sc = scoreHaystack(`#${t}`.toLowerCase(), [], haystack, tokens);
    if (sc > 0) {
      results.push({
        kind: "hashtag",
        id: t,
        title: `#${t}`,
        snippet: m.description,
        href: `/app/tags/${t}`,
        meta: m.label,
        score: sc,
      });
    }
  }
  return results;
}

function scoreHaystack(
  title: string,
  tags: string[],
  haystack: string,
  tokens: string[],
): number {
  if (tokens.length === 0) return 0;
  const lowerTags = tags.map((t) => t.toLowerCase());
  let s = 0;
  let allHit = true;
  for (const tok of tokens) {
    let hit = false;
    if (title.includes(tok)) {
      s += 10;
      hit = true;
    }
    if (lowerTags.some((t) => t === tok || t.includes(tok))) {
      s += 8;
      hit = true;
    }
    if (haystack.includes(tok)) {
      s += 3;
      hit = true;
    }
    if (!hit) allHit = false;
  }
  if (allHit) s += 5;
  return s;
}

interface NewsApiResult {
  id: string;
  source_code: string;
  headline: string;
  analysis: string;
  impact: string;
  bias: string;
  affects: string[];
  tags: string[];
  author: string;
  published_at: string | null;
  fetched_at: string;
}

async function fetchNewsResults(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}`,
    );
    if (!res.ok) return [];
    const { results } = (await res.json()) as { results: NewsApiResult[] };
    return results.map((n) => ({
      kind: "news" as const,
      id: n.id,
      title: n.headline,
      snippet: n.analysis,
      href: `/app/news/${n.id}`,
      author: n.author,
      tags: n.tags,
      meta: `${n.impact.toUpperCase()} · ${n.bias.toUpperCase()}`,
      score: 20,
    }));
  } catch {
    return [];
  }
}

export async function search(
  query: string,
  limit = 30,
): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);

  const [newsResults, hashtagResults, consultResults] = await Promise.all([
    fetchNewsResults(q),
    Promise.resolve(getHashtagResults(tokens)),
    Promise.resolve(getLocalConsultResults(tokens)),
  ]);

  const all = [...newsResults, ...hashtagResults, ...consultResults];
  all.sort((a, b) => b.score - a.score);
  return all.slice(0, limit);
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
    (a, b) => KIND_META[a[0]].order - KIND_META[b[0]].order,
  );
}
