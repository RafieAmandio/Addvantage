"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
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
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  data: GraphEdge;
}

const NODE_RADIUS = 8;

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

function nodePath(type: string): string {
  switch (type) {
    case "news": // diamond
      return `M0,-${NODE_RADIUS} L${NODE_RADIUS},0 L0,${NODE_RADIUS} L-${NODE_RADIUS},0 Z`;
    case "plan": // triangle
      return `M0,-${NODE_RADIUS} L${NODE_RADIUS},${NODE_RADIUS * 0.7} L-${NODE_RADIUS},${NODE_RADIUS * 0.7} Z`;
    case "channel": // square
      return `M-${NODE_RADIUS * 0.7},-${NODE_RADIUS * 0.7} L${NODE_RADIUS * 0.7},-${NODE_RADIUS * 0.7} L${NODE_RADIUS * 0.7},${NODE_RADIUS * 0.7} L-${NODE_RADIUS * 0.7},${NODE_RADIUS * 0.7} Z`;
    default: // circle approximation (octagon)
      return `M0,-${NODE_RADIUS} L${NODE_RADIUS * 0.7},-${NODE_RADIUS * 0.7} L${NODE_RADIUS},0 L${NODE_RADIUS * 0.7},${NODE_RADIUS * 0.7} L0,${NODE_RADIUS} L-${NODE_RADIUS * 0.7},${NODE_RADIUS * 0.7} L-${NODE_RADIUS},0 L-${NODE_RADIUS * 0.7},-${NODE_RADIUS * 0.7} Z`;
  }
}

function nodeColor(node: GraphNode): string {
  if (node.type === "news") {
    const impact = node.meta.impact as string;
    if (impact === "high") return "#FFD400";
    if (impact === "medium") return "rgba(255,255,255,0.6)";
    return "rgba(255,255,255,0.3)";
  }
  if (node.type === "plan") {
    const dir = node.meta.direction as string;
    return dir === "long" || dir === "bullish" ? "#65A30D" : "#DC2626";
  }
  return TYPE_COLORS[node.type] ?? "#6B7280";
}

function edgeDash(relation: string): string {
  if (relation === "tag") return "4 3";
  if (relation === "timeline") return "2 4";
  return "";
}

export function IntelMapClient() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [links, setLinks] = useState<SimLink[]>([]);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [tooltip, setTooltip] = useState<{ node: GraphNode; x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters
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

      const nodeMap = new Map<string, SimNode>();
      const simNodes: SimNode[] = data.nodes.map((n) => {
        const sn: SimNode = { data: n };
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
      setSelected(null);

      if (simRef.current) simRef.current.stop();

      const sim = forceSimulation<SimNode>(simNodes)
        .force("link", forceLink<SimNode, SimLink>(simLinks).distance(80).strength(0.3))
        .force("charge", forceManyBody().strength(-120))
        .force("center", forceCenter(0, 0))
        .force("collide", forceCollide<SimNode>(NODE_RADIUS * 2))
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

  // d3-zoom
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
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

  const connectedEdges = selected
    ? links.filter(
        (l) =>
          (l.source as SimNode).data.id === selected.id ||
          (l.target as SimNode).data.id === selected.id,
      )
    : [];

  const connectedNodes = selected
    ? connectedEdges.map((l) => {
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
                const isConnected =
                  selected &&
                  (src.data.id === selected.id || tgt.data.id === selected.id);
                return (
                  <line
                    key={i}
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isConnected ? "rgba(255,212,0,0.3)" : "rgba(255,255,255,0.06)"}
                    strokeWidth={isConnected ? 1.5 : 0.5}
                    strokeDasharray={edgeDash(l.data.relation)}
                  />
                );
              })}

              {/* nodes */}
              {nodes.map((n) => {
                if (n.x == null || n.y == null) return null;
                const isSelected = selected?.id === n.data.id;
                const isConnected =
                  selected &&
                  connectedEdges.some(
                    (l) =>
                      (l.source as SimNode).data.id === n.data.id ||
                      (l.target as SimNode).data.id === n.data.id,
                  );
                const dimmed = selected && !isSelected && !isConnected;
                return (
                  <g
                    key={n.data.id}
                    transform={`translate(${n.x}, ${n.y})`}
                    className="cursor-pointer"
                    onClick={() => setSelected(isSelected ? null : n.data)}
                    onMouseEnter={(e) => {
                      const rect = svgRef.current?.getBoundingClientRect();
                      if (rect) {
                        setTooltip({
                          node: n.data,
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top - 40,
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {isSelected && (
                      <circle
                        r={NODE_RADIUS + 4}
                        fill="none"
                        stroke="#FFD400"
                        strokeWidth={1}
                        opacity={0.6}
                      />
                    )}
                    <path
                      d={nodePath(n.data.type)}
                      fill={nodeColor(n.data)}
                      opacity={dimmed ? 0.15 : 1}
                      stroke={isSelected ? "#FFD400" : "none"}
                      strokeWidth={isSelected ? 1.5 : 0}
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* tooltip */}
          {tooltip && (
            <div
              className="pointer-events-none absolute z-20 border border-gray-3 bg-black/90 px-2 py-1"
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
              </div>
              <div className="mt-0.5 max-w-[200px] truncate font-mono text-[10px] text-white">
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
