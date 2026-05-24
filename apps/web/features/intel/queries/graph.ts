import { apiGet } from "@/lib/api/client";

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

export interface GraphCluster {
  symbol: string;
  nodeIds: string[];
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: GraphCluster[];
}

export interface GraphFilters {
  symbols?: string[];
  types?: string[];
  tags?: string[];
  from?: string;
  to?: string;
  limit?: number;
}

export async function fetchGraph(filters: GraphFilters): Promise<GraphData> {
  const params = new URLSearchParams();
  if (filters.symbols?.length) params.set("symbols", filters.symbols.join(","));
  if (filters.types?.length) params.set("types", filters.types.join(","));
  if (filters.tags?.length) params.set("tags", filters.tags.join(","));
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return apiGet<GraphData>(`/graph${qs ? `?${qs}` : ""}`);
}
