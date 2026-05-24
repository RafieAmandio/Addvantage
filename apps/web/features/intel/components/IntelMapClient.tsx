"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import { zoom, zoomIdentity, type D3ZoomEvent } from "d3-zoom";
import { select } from "d3-selection";
import { cn } from "@/lib/cn";
import { fetchGraph, type GraphNode, type GraphEdge, type GraphFilters } from "../queries/graph";
import { IntelDetailPanel } from "./IntelDetailPanel";

interface SimNode extends SimulationNodeDatum {
  data: GraphNode;
  cluster?: string;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  data: GraphEdge;
}

interface Cluster {
  symbol: string;
  nodeIds: string[];
}

const NODE_R = 6;

const TYPE_COLORS: Record<string, string> = {
  news: "#FFD400",
  plan: "#65A30D",
  channel: "#9CA3AF",
  event: "#6B7280",
};

const TIME_RANGES = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "ALL", days: 0 },
] as const;

const CONTENT_TYPES = ["news", "plan", "channel", "event"] as const;

function nodePath(type: string, r: number): string {
  switch (type) {
    case "news":
      return `M0,-${r} L${r},0 L0,${r} L-${r},0 Z`;
    case "plan":
      return `M0,-${r} L${r},${r * 0.8} L-${r},${r * 0.8} Z`;
    case "channel": {
      const s = r * 0.75;
      return `M-${s},-${s} L${s},-${s} L${s},${s} L-${s},${s} Z`;
    }
    default:
      return `M0,-${r} A${r},${r} 0 1,1 0,${r} A${r},${r} 0 1,1 0,-${r} Z`;
  }
}

function nodeColor(node: GraphNode): string {
  if (node.type === "news") {
    const impact = node.meta.impact as string;
    if (impact === "high") return "#FFD400";
    if (impact === "medium") return "rgba(255,255,255,0.55)";
    return "rgba(255,255,255,0.25)";
  }
  if (node.type === "plan") {
    const dir = node.meta.direction as string;
    return dir === "long" || dir === "bullish" ? "#65A30D" : "#DC2626";
  }
  return TYPE_COLORS[node.type] ?? "#6B7280";
}

function edgeStroke(relation: string): { dash: string; opacity: number } {
  if (relation === "tag") return { dash: "3 4", opacity: 0.12 };
  if (relation === "timeline") return { dash: "2 3", opacity: 0.2 };
  return { dash: "", opacity: 0.1 };
}

export function IntelMapClient() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [links, setLinks] = useState<SimLink[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ node: GraphNode; x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(CONTENT_TYPES));
  const [timeRange, setTimeRange] = useState<(typeof TIME_RANGES)[number]>(TIME_RANGES[3]);
  const [symbolSearch, setSymbolSearch] = useState("");
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null);

  const loadGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: GraphFilters = { limit: 300 };
      const types = [...activeTypes];
      if (types.length < CONTENT_TYPES.length) filters.types = types;
      if (timeRange.days > 0) {
        const from = new Date();
        from.setDate(from.getDate() - timeRange.days);
        filters.from = from.toISOString();
      }
      if (symbolSearch.trim()) {
        filters.symbols = symbolSearch.split(",").map((s) => s.trim()).filter(Boolean);
      }
      const data = await fetchGraph(filters);
      const serverClusters: Cluster[] = data.clusters ?? [];

      // assign each node a primary cluster
      const nodeCluster = new Map<string, string>();
      for (const c of serverClusters) {
        for (const id of c.nodeIds) {
          if (!nodeCluster.has(id)) nodeCluster.set(id, c.symbol);
        }
      }

      // position clusters in a ring layout
      const clusterCenters = new Map<string, { x: number; y: number }>();
      const ringRadius = Math.max(150, serverClusters.length * 40);
      serverClusters.forEach((c, i) => {
        const angle = (2 * Math.PI * i) / serverClusters.length - Math.PI / 2;
        clusterCenters.set(c.symbol, {
          x: Math.cos(angle) * ringRadius,
          y: Math.sin(angle) * ringRadius,
        });
      });

      const nodeMap = new Map<string, SimNode>();
      const simNodes: SimNode[] = data.nodes.map((n) => {
        const cl = nodeCluster.get(n.id);
        const center = cl ? clusterCenters.get(cl) : undefined;
        const sn: SimNode = {
          data: n,
          cluster: cl,
          x: center ? center.x + (Math.random() - 0.5) * 60 : (Math.random() - 0.5) * 200,
          y: center ? center.y + (Math.random() - 0.5) * 60 : (Math.random() - 0.5) * 200,
        };
        nodeMap.set(n.id, sn);
        return sn;
      });

      const simLinks: SimLink[] = data.edges
        .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
        .map((e) => ({
          source: nodeMap.get(e.source)!,
          target: nodeMap.get(e.target)!,
          data: e,
        }));

      setNodes(simNodes);
      setLinks(simLinks);
      setClusters(serverClusters);
      setSelected(null);

      if (simRef.current) simRef.current.stop();

      const sim = forceSimulation<SimNode>(simNodes)
        .force(
          "link",
          forceLink<SimNode, SimLink>(simLinks)
            .id((d) => d.data.id)
            .distance(50)
            .strength(0.15),
        )
        .force("charge", forceManyBody().strength(-60).distanceMax(300))
        .force("collide", forceCollide<SimNode>(NODE_R + 3).strength(0.8))
        .force(
          "clusterX",
          forceX<SimNode>((d) => {
            const c = d.cluster ? clusterCenters.get(d.cluster) : undefined;
            return c ? c.x : 0;
          }).strength(0.15),
        )
        .force(
          "clusterY",
          forceY<SimNode>((d) => {
            const c = d.cluster ? clusterCenters.get(d.cluster) : undefined;
            return c ? c.y : 0;
          }).strength(0.15),
        )
        .force("centerX", forceX(0).strength(0.02))
        .force("centerY", forceY(0).strength(0.02))
        .alpha(0.8)
        .alphaDecay(0.02)
        .on("tick", () => {
          setNodes((prev) => [...prev]);
          setLinks((prev) => [...prev]);
        });

      simRef.current = sim;
    } catch {
      setError("Failed to load intel map");
    } finally {
      setLoading(false);
    }
  }, [activeTypes, timeRange, symbolSearch]);

  useEffect(() => {
    loadGraph();
    return () => { simRef.current?.stop(); };
  }, [loadGraph]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 5])
      .on("zoom", (e: D3ZoomEvent<SVGSVGElement, unknown>) => {
        setTransform({ x: e.transform.x, y: e.transform.y, k: e.transform.k });
      });

    const sel = select(svg);
    sel.call(zoomBehavior);
    sel.call(zoomBehavior.transform, zoomIdentity);

    return () => { sel.on(".zoom", null); };
  }, []);

  const toggleType = (type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const w = containerRef.current?.clientWidth ?? 800;
  const h = containerRef.current?.clientHeight ?? 600;

  // compute cluster centroids from actual node positions
  const clusterCentroids = useMemo(() => {
    const map = new Map<string, { x: number; y: number; count: number }>();
    for (const n of nodes) {
      if (!n.cluster || n.x == null || n.y == null) continue;
      const c = map.get(n.cluster);
      if (c) {
        c.x += n.x;
        c.y += n.y;
        c.count++;
      } else {
        map.set(n.cluster, { x: n.x, y: n.y, count: 1 });
      }
    }
    return new Map(
      [...map.entries()].map(([k, v]) => [k, { x: v.x / v.count, y: v.y / v.count }]),
    );
  }, [nodes]);

  const focusId = selected?.id ?? hovered;

  const connectedIds = useMemo(() => {
    if (!focusId) return new Set<string>();
    const ids = new Set<string>();
    for (const l of links) {
      const srcId = (l.source as SimNode).data.id;
      const tgtId = (l.target as SimNode).data.id;
      if (srcId === focusId || tgtId === focusId) {
        ids.add(srcId);
        ids.add(tgtId);
      }
    }
    return ids;
  }, [focusId, links]);

  const connectedNodes = selected
    ? links
        .filter(
          (l) =>
            (l.source as SimNode).data.id === selected.id ||
            (l.target as SimNode).data.id === selected.id,
        )
        .map((l) => {
          const src = (l.source as SimNode).data;
          const tgt = (l.target as SimNode).data;
          return {
            node: src.id === selected.id ? tgt : src,
            relation: l.data.relation,
            label: l.data.label,
          };
        })
    : [];

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* ─── filter bar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] bg-black px-4 py-3 sm:px-6">
        <input
          type="text"
          value={symbolSearch}
          onChange={(e) => setSymbolSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadGraph()}
          placeholder="Filter symbols (e.g. XAUUSD, EURUSD)"
          className="w-48 border border-gray-3 bg-gray-2 px-2 py-1.5 font-mono text-[10px] text-white placeholder:text-white/30 transition-colors focus-visible:border-brand focus-visible:outline-none"
        />

        <div className="flex gap-1">
          {CONTENT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={cn(
                "border px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 transition-colors",
                "focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
                activeTypes.has(t)
                  ? "border-current text-white"
                  : "border-gray-3 text-white/25"
              )}
              style={activeTypes.has(t) ? { color: TYPE_COLORS[t] } : undefined}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setTimeRange(r)}
              className={cn(
                "border px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 transition-colors",
                "focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
                timeRange.label === r.label
                  ? "border-brand text-brand"
                  : "border-gray-3 text-white/40 hover:text-white/60"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="ml-auto font-mono text-[9px] uppercase tracking-widest2 text-white/30">
          {nodes.length} NODES · {links.length} EDGES
        </div>
      </div>

      {/* ─── main area ───────────────────────────────────────────────── */}
      <div className="relative flex flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className={cn(
            "relative flex-1 bg-grid cursor-grab active:cursor-grabbing",
            selected && "lg:w-[60%]"
          )}
        >
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand animate-pulse">
                Computing connections...
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/80">
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-blood-bright">
                {error}
              </div>
              <button
                onClick={loadGraph}
                className="border border-brand px-3 py-1 font-mono text-[9px] uppercase tracking-widest2 text-brand transition-colors hover:bg-brand hover:text-black"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/30">
                  No connections found
                </div>
                <div className="mt-2 font-display text-lg text-white/50">
                  Adjust filters to expand the search
                </div>
              </div>
            </div>
          )}

          <svg
            ref={svgRef}
            className="h-full w-full"
            viewBox={`0 0 ${w} ${h}`}
          >
            <g transform={`translate(${transform.x + w / 2}, ${transform.y + h / 2}) scale(${transform.k})`}>
              {/* edges */}
              {links.map((l, i) => {
                const src = l.source as SimNode;
                const tgt = l.target as SimNode;
                if (src.x == null || tgt.x == null) return null;
                const isFocused =
                  focusId &&
                  (src.data.id === focusId || tgt.data.id === focusId);
                if (focusId && !isFocused) return null;
                const style = edgeStroke(l.data.relation);
                return (
                  <line
                    key={i}
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isFocused ? "rgba(255,212,0,0.35)" : `rgba(255,255,255,${style.opacity})`}
                    strokeWidth={isFocused ? 1 : 0.5}
                    strokeDasharray={style.dash}
                  />
                );
              })}

              {/* cluster labels */}
              {clusterCentroids.size > 0 &&
                [...clusterCentroids.entries()].map(([symbol, pos]) => (
                  <text
                    key={symbol}
                    x={pos.x}
                    y={pos.y - 30}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.2)"
                    fontSize="9"
                    fontFamily="monospace"
                    letterSpacing="0.15em"
                  >
                    {symbol}
                  </text>
                ))}

              {/* nodes */}
              {nodes.map((n) => {
                if (n.x == null || n.y == null) return null;
                const isSelected = selected?.id === n.data.id;
                const isHovered = hovered === n.data.id;
                const isConnected = focusId && connectedIds.has(n.data.id);
                const dimmed = focusId && !isSelected && !isHovered && !isConnected;
                return (
                  <g
                    key={n.data.id}
                    transform={`translate(${n.x}, ${n.y})`}
                    className="cursor-pointer"
                    onClick={() => setSelected(isSelected ? null : n.data)}
                    onMouseEnter={(e) => {
                      setHovered(n.data.id);
                      const rect = svgRef.current?.getBoundingClientRect();
                      if (rect) {
                        setTooltip({
                          node: n.data,
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top - 40,
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setHovered(null);
                      setTooltip(null);
                    }}
                  >
                    {isSelected && (
                      <circle
                        r={NODE_R + 6}
                        fill="none"
                        stroke="#FFD400"
                        strokeWidth={0.5}
                        opacity={0.5}
                      />
                    )}
                    <path
                      d={nodePath(n.data.type, NODE_R)}
                      fill={nodeColor(n.data)}
                      opacity={dimmed ? 0.1 : isHovered ? 1 : 0.85}
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* tooltip */}
          {tooltip && (
            <div
              className="pointer-events-none absolute z-20 border border-gray-3 bg-black/95 px-3 py-2"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2"
                  style={{ backgroundColor: TYPE_COLORS[tooltip.node.type] }}
                />
                <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/50">
                  {tooltip.node.type}
                </span>
                {tooltip.node.symbols.length > 0 && (
                  <span className="font-mono text-[9px] text-brand/60">
                    {tooltip.node.symbols.slice(0, 3).join(", ")}
                  </span>
                )}
              </div>
              <div className="mt-1 max-w-[240px] truncate font-mono text-[10px] text-white">
                {tooltip.node.title}
              </div>
              <div className="mt-0.5 font-mono text-[8px] text-white/30">
                {new Date(tooltip.node.timestamp).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {/* detail panel */}
        {selected && (
          <IntelDetailPanel
            node={selected}
            connections={connectedNodes}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      {/* ─── mobile: list fallback ───────────────────────────────────── */}
      <div className="block border-t border-white/[0.06] lg:hidden">
        <div className="max-h-48 overflow-y-auto px-4 py-2">
          {nodes.slice(0, 20).map((n) => (
            <button
              key={n.data.id}
              onClick={() => setSelected(n.data)}
              className="flex w-full items-center gap-2 border-b border-white/[0.04] py-1.5 text-left"
            >
              <span
                className="inline-block h-2 w-2 shrink-0"
                style={{ backgroundColor: TYPE_COLORS[n.data.type] }}
              />
              <span className="truncate font-mono text-[10px] text-white/70">
                {n.data.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
