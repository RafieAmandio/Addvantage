"use client";

import Link from "next/link";
import { formatWibDateTime } from "@/lib/cn";
import { instrumentHref } from "@/features/atr/components/FilterControls";
import type { GraphNode } from "../queries/graph";

const TYPE_COLORS: Record<string, string> = {
  news: "#FFD400",
  plan: "#00DD94",
  channel: "rgba(255,255,255,0.4)",
  event: "rgba(255,255,255,0.4)",
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">{children}</div>
);

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
    <div className="fixed inset-0 z-30 bg-[#0A0A0A] p-4 lg:static lg:w-[360px] lg:shrink-0 lg:bg-transparent lg:p-0">
      <div className="flex h-full flex-col overflow-y-auto rounded-2xl bg-panel p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2" style={{ backgroundColor: TYPE_COLORS[node.type] }} />
            <Eyebrow>{node.type}</Eyebrow>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] text-white/50 transition-colors hover:bg-raised hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 flex-1">
          <div className="text-[12px] text-white/40">{formatWibDateTime(node.timestamp)}</div>
          <h3 className="mt-1 text-[18px] font-semibold leading-6 text-white">{node.title}</h3>
          {node.summary && <p className="mt-2 text-[14px] leading-[21px] text-white/60">{node.summary}</p>}

          {node.symbols.length > 0 && (
            <div className="mt-5">
              <Eyebrow>Symbols</Eyebrow>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {node.symbols.map((s) => (
                  <Link
                    key={s}
                    href={instrumentHref(s)}
                    className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] text-white/70 hover:border-brand hover:text-brand"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {node.tags.length > 0 && (
            <div className="mt-4">
              <Eyebrow>Tags</Eyebrow>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {node.tags.map((t) => (
                  <span key={t} className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] text-white/60">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {Object.keys(node.meta).length > 0 && (
            <dl className="mt-4 divide-y divide-white/[0.07]">
              {Object.entries(node.meta)
                .filter(([, v]) => v != null && v !== "")
                .slice(0, 6)
                .map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3 py-2">
                    <dt className="text-[13px] capitalize text-white/40">{k}</dt>
                    <dd className="truncate text-right text-[13px] text-white/80">{String(v)}</dd>
                  </div>
                ))}
            </dl>
          )}

          {connections.length > 0 && (
            <div className="mt-5">
              <Eyebrow>Connections ({connections.length})</Eyebrow>
              <ul className="mt-1 divide-y divide-white/[0.07]">
                {connections.slice(0, 15).map((c, i) => (
                  <li key={i} className="flex items-center gap-2 py-2">
                    <span className="inline-block h-1.5 w-1.5 shrink-0" style={{ backgroundColor: TYPE_COLORS[c.node.type] }} />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-white/70">{c.node.title}</span>
                    <span className="shrink-0 text-[12px] text-white/30">
                      {c.relation}: {c.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {link && (
          <Link
            href={link}
            className="mt-5 self-start rounded-full border border-white/[0.14] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            Open {node.type}
          </Link>
        )}
      </div>
    </div>
  );
}
