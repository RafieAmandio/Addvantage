"use client";

import Link from "next/link";
import { formatWibDateTime } from "@/lib/cn";
import type { GraphNode } from "../queries/graph";

const TYPE_COLORS: Record<string, string> = {
  news: "#FFD400",
  plan: "#65A30D",
  channel: "#9CA3AF",
  event: "#6B7280",
};

function detailLink(node: GraphNode): string | null {
  switch (node.type) {
    case "news":
      return `/app/news`;
    case "plan":
      return `/app/plan`;
    case "channel":
      return `/app/channel`;
    default:
      return null;
  }
}

interface Connection {
  node: GraphNode;
  relation: string;
  label: string;
}

export function IntelDetailPanel({
  node,
  connections,
  onClose,
}: {
  node: GraphNode;
  connections: Connection[];
  onClose: () => void;
}) {
  const link = detailLink(node);

  return (
    <div className="fixed inset-y-0 right-0 z-30 w-full border-l border-white/[0.06] bg-black/95 backdrop-blur-sm lg:static lg:w-[40%]">
      <div className="flex h-full flex-col overflow-y-auto">
        {/* header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5"
              style={{ backgroundColor: TYPE_COLORS[node.type] }}
            />
            <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/50">
              {node.type}
            </span>
          </div>
          <button
            onClick={onClose}
            className="h-6 w-6 font-mono text-[10px] text-white/40 transition-colors hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            ✕
          </button>
        </div>

        {/* content */}
        <div className="flex-1 px-4 py-4">
          <div className="font-mono text-[9px] text-white/30">
            {formatWibDateTime(node.timestamp)}
          </div>
          <h3 className="mt-1 font-display text-lg leading-snug text-white">
            {node.title}
          </h3>
          <p className="mt-3 font-mono text-xs leading-relaxed text-white/60">
            {node.summary}
          </p>

          {/* symbols */}
          {node.symbols.length > 0 && (
            <div className="mt-4">
              <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/30">
                Symbols
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {node.symbols.map((s) => (
                  <span
                    key={s}
                    className="border border-brand/30 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-brand/70"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* tags */}
          {node.tags.length > 0 && (
            <div className="mt-3">
              <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/30">
                Tags
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {node.tags.map((t) => (
                  <span
                    key={t}
                    className="border border-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/50"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* metadata */}
          {Object.keys(node.meta).length > 0 && (
            <div className="mt-3">
              <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/30">
                Metadata
              </div>
              <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(node.meta)
                  .filter(([, v]) => v != null && v !== "")
                  .slice(0, 6)
                  .map(([k, v]) => (
                    <div key={k} className="flex items-baseline gap-1">
                      <span className="font-mono text-[8px] uppercase text-white/25">
                        {k}
                      </span>
                      <span className="font-mono text-[9px] text-white/60">
                        {String(v)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* connections */}
          {connections.length > 0 && (
            <div className="mt-5 border-t border-white/[0.06] pt-4">
              <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/30">
                Connections ({connections.length})
              </div>
              <div className="mt-2 space-y-1.5">
                {connections.slice(0, 15).map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2"
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 shrink-0"
                      style={{ backgroundColor: TYPE_COLORS[c.node.type] }}
                    />
                    <span className="flex-1 truncate font-mono text-[9px] text-white/60">
                      {c.node.title}
                    </span>
                    <span className="shrink-0 font-mono text-[8px] uppercase text-white/20">
                      {c.relation}: {c.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        {link && (
          <div className="border-t border-white/[0.06] px-4 py-3">
            <Link
              href={link}
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest2 text-brand transition-colors hover:text-brand-dim"
            >
              View Full
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
