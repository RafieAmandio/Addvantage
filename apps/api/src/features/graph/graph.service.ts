import { createHash } from "crypto";
import { getRedis } from "@/config/redis.js";
import { graphRepository } from "./graph.repository.js";
import type { GraphQuery } from "./graph.validation.js";

export interface GraphNode {
  id: string;
  type: "news" | "plan" | "channel" | "event";
  title: string;
  summary: string;
  symbols: string[];
  tags: string[];
  timestamp: string;
  meta: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: "symbol" | "tag" | "timeline";
  label: string;
}

const VALID_TYPES = new Set(["news", "plan", "channel", "event"]);

function cacheKey(q: GraphQuery, limit: number): string {
  const raw = JSON.stringify({ ...q, limit });
  const hash = createHash("sha256").update(raw).digest("hex").slice(0, 16);
  return `graph:${hash}`;
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max) + "...";
}

export const graphService = {
  async getGraph(q: GraphQuery) {
    const limit = q.limit ?? 200;
    const types = q.types
      ? q.types.filter((t) => VALID_TYPES.has(t))
      : [...VALID_TYPES];

    const redis = getRedis();
    const key = cacheKey(q, limit);

    if (redis) {
      try {
        const cached = await redis.get<{ nodes: GraphNode[]; edges: GraphEdge[] }>(key);
        if (cached) return cached;
      } catch {
        // cache miss, proceed
      }
    }

    // Weight the node budget toward recent, high-signal sources. News + macro
    // events are the live pulse; published plans and channel posts are authored
    // occasionally and otherwise dilute the graph with stale anchors. Allocate
    // by weight across whichever types were requested (renormalized).
    const TYPE_WEIGHT: Record<string, number> = {
      news: 0.55,
      event: 0.3,
      plan: 0.1,
      channel: 0.05,
    };
    const activeWeight =
      types.reduce((sum, t) => sum + (TYPE_WEIGHT[t] ?? 0), 0) || 1;
    const perTypeFor = (t: string) =>
      Math.max(1, Math.ceil((limit * (TYPE_WEIGHT[t] ?? 0)) / activeWeight));

    const fetchers: Promise<GraphNode[]>[] = [];

    if (types.includes("news")) {
      fetchers.push(
        graphRepository.fetchNews(q, perTypeFor("news")).then((rows) =>
          rows.map((r) => ({
            id: r.id,
            type: "news" as const,
            title: r.headline,
            summary: truncate(r.analysis, 200),
            symbols: r.affects,
            tags: r.tags,
            timestamp: (r.publishedAt ?? r.createdAt).toISOString(),
            meta: { impact: r.impact, bias: r.bias, sourceCode: r.sourceCode },
          })),
        ),
      );
    }

    if (types.includes("plan")) {
      fetchers.push(
        graphRepository.fetchPlans(q, perTypeFor("plan")).then((rows) =>
          rows.map((r) => ({
            id: r.id,
            type: "plan" as const,
            title: `${r.symbol} ${r.direction.toUpperCase()}`,
            summary: truncate(r.thesis, 200),
            symbols: [r.symbol],
            tags: r.tags,
            timestamp: (r.publishedAt ?? r.createdAt).toISOString(),
            meta: { direction: r.direction, bias: r.bias, status: r.status },
          })),
        ),
      );
    }

    if (types.includes("channel")) {
      fetchers.push(
        graphRepository.fetchChannel(q, perTypeFor("channel")).then((rows) =>
          rows.map((r) => ({
            id: r.id,
            type: "channel" as const,
            title: truncate(r.body, 60),
            summary: truncate(r.body, 200),
            symbols: [],
            tags: r.tags,
            timestamp: r.createdAt.toISOString(),
            meta: { author: r.author },
          })),
        ),
      );
    }

    if (types.includes("event")) {
      fetchers.push(
        graphRepository.fetchEvents(q, perTypeFor("event")).then((rows) =>
          rows.map((r) => ({
            id: r.id,
            type: "event" as const,
            title: r.title,
            summary: r.title,
            symbols: r.symbols,
            tags: [],
            timestamp: r.occurredAt.toISOString(),
            meta: { kind: r.kind, bias: r.bias, impact: r.impact, newsItemId: r.newsItemId },
          })),
        ),
      );
    }

    const nodeGroups = await Promise.all(fetchers);
    // Newest first, so the freshest intelligence is what survives the cap and
    // leads the node list the client renders.
    const nodes = nodeGroups
      .flat()
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);

    const edges = computeEdges(nodes);

    // compute symbol clusters for labels
    const clusterMap = new Map<string, string[]>();
    for (const n of nodes) {
      const primary = n.symbols[0];
      if (!primary) continue;
      const arr = clusterMap.get(primary);
      if (arr) arr.push(n.id);
      else clusterMap.set(primary, [n.id]);
    }
    const clusters = [...clusterMap.entries()]
      .filter(([, ids]) => ids.length >= 2)
      .map(([symbol, ids]) => ({ symbol, nodeIds: ids }));

    const result = { nodes, edges, clusters };

    if (redis) {
      try {
        await redis.set(key, result, { ex: 120 });
      } catch {
        // cache write failure, non-critical
      }
    }

    return result;
  },
};

function computeEdges(nodes: GraphNode[]): GraphEdge[] {
  const symbolIndex = new Map<string, string[]>();
  const tagIndex = new Map<string, string[]>();
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();

  for (const n of nodes) {
    for (const s of n.symbols) {
      const arr = symbolIndex.get(s);
      if (arr) arr.push(n.id);
      else symbolIndex.set(s, [n.id]);
    }
    for (const t of n.tags) {
      const arr = tagIndex.get(t);
      if (arr) arr.push(n.id);
      else tagIndex.set(t, [n.id]);
    }
  }

  // skip symbols that appear in >25% of nodes — they create noise, not signal
  const freqThreshold = Math.max(nodes.length * 0.25, 3);

  for (const [symbol, ids] of symbolIndex) {
    if (ids.length > freqThreshold) continue;
    for (let i = 0; i < ids.length; i++) {
      const src = ids[i]!;
      for (let j = i + 1; j < ids.length; j++) {
        const tgt = ids[j]!;
        const key = `${src}:${tgt}:symbol`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({ source: src, target: tgt, relation: "symbol", label: symbol });
      }
    }
  }

  for (const [tag, ids] of tagIndex) {
    if (ids.length > freqThreshold) continue;
    for (let i = 0; i < ids.length; i++) {
      const src = ids[i]!;
      for (let j = i + 1; j < ids.length; j++) {
        const tgt = ids[j]!;
        const key = `${src}:${tgt}:tag`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({ source: src, target: tgt, relation: "tag", label: tag });
      }
    }
  }

  // timeline event → news item direct links
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  for (const n of nodes) {
    if (n.type === "event" && n.meta.newsItemId && nodeById.has(n.meta.newsItemId as string)) {
      const key = `${n.id}:${n.meta.newsItemId}:timeline`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push({ source: n.id, target: n.meta.newsItemId as string, relation: "timeline", label: "source" });
      }
    }
  }

  return edges;
}
