"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface StepSeries {
  label: string;
  color: string;
  /** t = unix seconds, p = 0..1 */
  points: { t: number; p: number }[];
}

const PAD = { top: 30, right: 44, bottom: 26, left: 2 };
const GRID = [0, 0.25, 0.5, 0.75, 1];

function fmtDay(t: number) {
  return new Date(t * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function fmtStamp(t: number) {
  return new Date(t * 1000)
    .toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })
    .toUpperCase();
}
const pct = (p: number) => `${(p * 100).toFixed(p >= 0.995 || p < 0.1 ? 1 : 0)}%`;

/**
 * Probability chart in the Kalshi grammar: dotted horizontal grid, right axis,
 * step lines with an endpoint dot, vertical crosshair that writes values beside
 * it and dims everything to the right of the cursor.
 */
export function StepChart({ series, height = 300 }: { series: StepSeries[]; height?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [hoverT, setHoverT] = useState<number | null>(null);
  // Draw at the real pixel width so labels keep their size on phones.
  const [W, setW] = useState(720);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = W < 480 ? Math.round(height * 0.85) : height;

  const geo = useMemo(() => {
    const all = series.flatMap((s) => s.points.map((p) => p.t));
    if (all.length < 2) return null;
    const t0 = Math.min(...all);
    const t1 = Math.max(...all);
    const x = (t: number) => PAD.left + ((t - t0) / (t1 - t0 || 1)) * (W - PAD.left - PAD.right);
    const y = (p: number) => PAD.top + (1 - p) * (H - PAD.top - PAD.bottom);
    const n = W < 480 ? 2 : 4;
    const ticks = Array.from({ length: n + 1 }, (_, i) => t0 + ((t1 - t0) * i) / n);
    return { t0, t1, x, y, ticks };
  }, [series, H, W]);

  if (!geo) {
    return (
      <div ref={wrap} className="flex w-full items-center justify-center text-[13px] text-white/30" style={{ height }}>
        No history yet
      </div>
    );
  }
  const { x, y, ticks, t1 } = geo;
  const cutT = hoverT ?? t1;

  const valueAt = (pts: StepSeries["points"], t: number) => {
    let v = pts[0]?.p ?? 0;
    for (const pt of pts) {
      if (pt.t > t) break;
      v = pt.p;
    }
    return v;
  };
  const stepPath = (pts: StepSeries["points"]) =>
    pts.map((pt, i) => (i ? `H${x(pt.t).toFixed(1)}V${y(pt.p).toFixed(1)}` : `M${x(pt.t).toFixed(1)} ${y(pt.p).toFixed(1)}`)).join("");

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = ((e.clientX - r.left) / r.width) * W;
    const frac = Math.min(1, Math.max(0, (px - PAD.left) / (W - PAD.left - PAD.right)));
    setHoverT(geo.t0 + frac * (geo.t1 - geo.t0));
  };

  const cx = x(cutT);
  const right = cx < W * 0.78;
  const at = series.map((s) => ({ ...s, v: valueAt(s.points, cutT) })).sort((a, b) => b.v - a.v);
  let labelY = Math.min(Math.max(y(at[0]?.v ?? 0.5) - 18, PAD.top + 14), H - PAD.bottom - at.length * 46);

  return (
    <div ref={wrap} className="w-full">
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      className="block h-auto w-full touch-pan-y select-none"
      role="img"
      aria-label={series.map((s) => `${s.label} ${pct(s.points.at(-1)?.p ?? 0)}`).join(", ")}
      onPointerMove={onMove}
      onPointerDown={onMove}
      onPointerLeave={() => setHoverT(null)}
    >
      <style>{`text{paint-order:stroke;stroke:#121212;stroke-width:6px;stroke-linejoin:round}`}</style>
      {GRID.map((g) => (
        <g key={g}>
          <line x1={PAD.left} x2={W - PAD.right + 8} y1={y(g)} y2={y(g)} stroke="rgba(255,255,255,.12)" strokeDasharray="1 4" />
          <text x={W - 2} y={y(g) + 4} textAnchor="end" fill="rgba(255,255,255,.3)" fontSize={13}>
            {g * 100}%
          </text>
        </g>
      ))}
      {ticks.map((t, i) => (
        <text
          key={t}
          x={x(t)}
          y={H - 8}
          textAnchor={i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle"}
          fill="rgba(255,255,255,.55)"
          fontSize={13}
        >
          {fmtDay(t)}
        </text>
      ))}

      {series.map((s) => {
        const past = s.points.filter((p) => p.t <= cutT);
        const future = s.points.filter((p) => p.t >= (past.at(-1)?.t ?? cutT));
        const end = past.at(-1);
        return (
          <g key={s.label}>
            <path d={stepPath(past)} pathLength={1} className="line-draw" fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
            {hoverT !== null && future.length > 1 && (
              <path d={stepPath(future)} fill="none" stroke={s.color} strokeWidth={2} opacity={0.3} />
            )}
            {end && hoverT === null && <circle className="dot-ping" cx={x(cutT)} cy={y(valueAt(s.points, cutT))} r={5} fill={s.color} />}
            {end && <circle className="dot-pop" cx={x(cutT)} cy={y(valueAt(s.points, cutT))} r={5} fill={s.color} />}
          </g>
        );
      })}

      {hoverT !== null && (
        <g pointerEvents="none">
          <line x1={cx} x2={cx} y1={PAD.top - 6} y2={H - PAD.bottom} stroke="rgba(255,255,255,.3)" />
          <text x={cx} y={PAD.top - 14} textAnchor="middle" fill="rgba(255,255,255,.55)" fontSize={12} fontWeight={600} letterSpacing=".06em">
            {fmtStamp(cutT)}
          </text>
          {at.map((s) => {
            const ty = labelY;
            labelY += 46;
            return (
              <g key={s.label}>
                <text x={right ? cx + 14 : cx - 14} y={ty} textAnchor={right ? "start" : "end"} fill={s.color} fontSize={13} fontWeight={500}>
                  {s.label}
                </text>
                <text
                  x={right ? cx + 14 : cx - 14}
                  y={ty + 27}
                  textAnchor={right ? "start" : "end"}
                  fill={s.color}
                  fontSize={28}
                  fontWeight={600}
                  fontFamily='"Barlow Condensed", sans-serif'
                >
                  {pct(s.v)}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
    </div>
  );
}
