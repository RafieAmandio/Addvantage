"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface ScatterPoint {
  id: string;
  label: string;
  value: number;
  color: string;
  group: string;
  href: string;
  /** Triangle pointing up or down instead of a dot, e.g. today's direction. */
  shape?: "dot" | "up" | "down";
}

export interface ScatterBand {
  id: string;
  label: string;
  color: string;
  bg: string;
  min: number;
  max: number;
}

export interface ScatterRefLine {
  value: number;
  label: string;
  color: string;
  dashed?: boolean;
  strong?: boolean;
}

const H = 440;
const PAD = { top: 16, right: 92, bottom: 30, left: 36 };
const R = 5;
const CHAR_W = 6.1;
const LABEL_H = 11;
const MIN_W = 600;

type Box = { x1: number; y1: number; x2: number; y2: number };
const hit = (a: Box, b: Box) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;

/**
 * Labelled scatter on a zoned value axis (CoinGlass RSI heatmap style).
 * X is split into one column per group, points keep the caller's order inside a column,
 * so a value change animates as a vertical move.
 */
export function ZoneScatter({
  points,
  groups,
  bands,
  yMin,
  yMax,
  ticks,
  refLines = [],
  unit = "",
  renderTip,
  ariaLabel,
}: {
  points: ScatterPoint[];
  groups: { id: string; label: string }[];
  bands: ScatterBand[];
  yMin: number;
  yMax: number;
  ticks: number[];
  refLines?: ScatterRefLine[];
  unit?: string;
  renderTip: (id: string) => React.ReactNode;
  ariaLabel: string;
}) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState<number | null>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCw(Math.round(e!.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const W = Math.max(MIN_W, cw ?? MIN_W);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + innerH - ((Math.min(Math.max(v, yMin), yMax) - yMin) / (yMax - yMin)) * innerH;

  const layout = useMemo(() => {
    const used = groups.map((g) => ({ ...g, pts: points.filter((p) => p.group === g.id) })).filter((g) => g.pts.length);
    const total = used.reduce((s, g) => s + g.pts.length, 0) || 1;
    let cursor = PAD.left;
    const cols = used.map((g) => {
      const w = (g.pts.length / total) * innerW;
      const col = { id: g.id, label: g.label, x1: cursor, x2: cursor + w };
      cursor += w;
      return col;
    });
    const placed = used.flatMap((g, gi) =>
      g.pts.map((p, i) => ({ p, x: cols[gi]!.x1 + ((i + 0.5) / g.pts.length) * (cols[gi]!.x2 - cols[gi]!.x1), y: y(p.value) })),
    );

    // Label pass: try above, below, right, left, then the diagonals; skip the label when all four collide.
    const boxes: Box[] = placed.map(({ x, y: py }) => ({ x1: x - R, y1: py - R, x2: x + R, y2: py + R }));
    const labels = placed.map(({ p, x, y: py }) => {
      const w = p.label.length * CHAR_W;
      const tries: { tx: number; ty: number; anchor: "middle" | "start" | "end" }[] = [
        { tx: x, ty: py - R - 3, anchor: "middle" },
        { tx: x, ty: py + R + LABEL_H, anchor: "middle" },
        { tx: x + R + 3, ty: py + 4, anchor: "start" },
        { tx: x - R - 3, ty: py + 4, anchor: "end" },
        { tx: x + 2, ty: py - R - 2, anchor: "start" },
        { tx: x - 2, ty: py - R - 2, anchor: "end" },
        { tx: x + 2, ty: py + R + LABEL_H - 1, anchor: "start" },
        { tx: x - 2, ty: py + R + LABEL_H - 1, anchor: "end" },
      ];
      for (const t of tries) {
        const x1 = t.anchor === "middle" ? t.tx - w / 2 : t.anchor === "start" ? t.tx : t.tx - w;
        const b = { x1, y1: t.ty - LABEL_H + 2, x2: x1 + w, y2: t.ty + 1 };
        if (b.x1 < PAD.left - 4 || b.x2 > W - PAD.right + 4 || b.y1 < PAD.top || b.y2 > H - PAD.bottom) continue;
        if (boxes.some((o) => hit(o, b))) continue;
        boxes.push(b);
        return t;
      }
      return null;
    });
    return { cols, placed, labels };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, groups, innerW, W, yMin, yMax]);

  const act = active ? layout.placed.find((d) => d.p.id === active) : undefined;
  const tipLeft = act ? (act.x > W - 230 ? act.x - 214 : act.x + 14) : 0;
  // Upper half: tip hangs below the dot; lower half: it sits above, so it never spills out of the chart box.
  const tipPos = act ? (act.y < H / 2 ? { top: Math.max(act.y - 30, 4) } : { bottom: Math.max(H - act.y - 30, 4) }) : {};

  return (
    <div ref={wrapRef} className="-mx-1 overflow-x-auto overscroll-x-contain">
      <div className="relative" style={{ width: W, height: H }} onMouseLeave={() => setActive(null)}>
        {cw !== null && (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="select-none" role="group" aria-label={ariaLabel} onClick={() => setActive(null)}>
            {bands.map((b) => {
              const y1 = y(Math.min(b.max, yMax));
              const y2 = y(b.min);
              if (y2 - y1 <= 0) return null;
              return (
                <g key={b.id}>
                  <rect x={PAD.left} y={y1} width={innerW} height={y2 - y1} fill={b.bg} />
                  {refLines.every((r) => Math.abs(y(r.value) - (y1 + y2) / 2) > 14) && (
                    <text x={W - PAD.right + 10} y={(y1 + y2) / 2 + 4} className="text-[11px] font-semibold" fill={b.color}>
                      {b.label}
                    </text>
                  )}
                </g>
              );
            })}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={PAD.left + innerW} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.05)" />
                <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="font-num text-[12px]" fill="rgba(255,255,255,0.35)">
                  {t}
                  {unit}
                </text>
              </g>
            ))}
            {layout.cols.map((c, i) => (
              <g key={c.id}>
                {i > 0 && <line x1={c.x1} x2={c.x1} y1={PAD.top} y2={H - PAD.bottom} stroke="rgba(255,255,255,0.08)" />}
                <text x={(c.x1 + c.x2) / 2} y={H - 10} textAnchor="middle" className="text-[11px] font-semibold uppercase tracking-[0.08em]" fill="rgba(255,255,255,0.4)">
                  {c.label}
                </text>
              </g>
            ))}
            {refLines.map((r, i) => (
              <g
                key={i}
                className="pointer-events-none transition-transform duration-500 ease-out"
                style={{ transform: `translateY(${y(r.value)}px)` }}
              >
                <line
                  x1={PAD.left}
                  x2={PAD.left + innerW}
                  stroke={r.color}
                  strokeWidth={r.strong ? 1.5 : 1}
                  strokeDasharray={r.dashed ? "5 4" : undefined}
                />
                <text x={W - PAD.right + 10} y={4} className="font-num text-[13px] font-semibold" fill={r.color}>
                  {r.label}
                </text>
              </g>
            ))}
            {layout.placed.map(({ p, x, y: py }, i) => {
              const on = p.id === active;
              const lab = layout.labels[i];
              const s = on ? R + 2 : R;
              return (
                <g
                  key={p.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`${p.label} ${p.value.toFixed(1)}${unit}`}
                  className="cursor-pointer outline-none transition-transform duration-500 ease-out"
                  style={{ transform: `translate(${x}px, ${py}px)` }}
                  onMouseEnter={() => setActive(p.id)}
                  onFocus={() => setActive(p.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActive(p.id);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && router.push(p.href)}
                >
                  <circle r={12} fill="transparent" />
                  {p.shape === "up" || p.shape === "down" ? (
                    <path
                      d={p.shape === "up" ? `M0 ${-s - 1} L${s + 1} ${s} L${-s - 1} ${s} Z` : `M0 ${s + 1} L${s + 1} ${-s} L${-s - 1} ${-s} Z`}
                      fill={p.color}
                      stroke={on ? "#fff" : "none"}
                      strokeWidth={1.5}
                    />
                  ) : (
                    <circle r={s} fill={p.color} stroke={on ? "#fff" : "none"} strokeWidth={1.5} />
                  )}
                  {(lab || on) && (
                    <text
                      x={(lab?.tx ?? x) - x}
                      y={(lab?.ty ?? py - R - 3) - py}
                      textAnchor={lab?.anchor ?? "middle"}
                      className="pointer-events-none text-[10px] font-semibold"
                      fill={on ? "#fff" : "rgba(255,255,255,0.6)"}
                    >
                      {p.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
        {act && (
          <div className="absolute z-10 w-[200px] rounded-lg border border-white/[0.1] bg-raised p-3 shadow-xl" style={{ left: tipLeft, ...tipPos }}>
            {renderTip(act.p.id)}
          </div>
        )}
      </div>
    </div>
  );
}

/** Tooltip body: name with a swatch, label/value rows, link to the instrument page. */
export function ScatterTip({ title, color, rows, href }: { title: string; color: string; rows: [string, React.ReactNode][]; href: string }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[14px] font-semibold text-white">{title}</span>
      </div>
      <dl className="mt-2 space-y-1 text-[12px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-white/45">{k}</dt>
            <dd className="font-num text-[15px] font-medium leading-4 text-white">{v}</dd>
          </div>
        ))}
      </dl>
      <Link href={href} className="mt-2.5 block text-[12px] font-medium text-brand hover:underline">
        Open {title}
      </Link>
    </>
  );
}
