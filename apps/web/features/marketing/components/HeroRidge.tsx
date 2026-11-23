"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RidgeData } from "@/features/marketing/lib/landing";
import { C, S } from "@/features/marketing/lib/iso";
import "./hero-ridge.css";

const PX = 3; // one dither pixel, in CSS px
const HMAX = 5.5; // tallest column, in cube units
// Dark to light. Grey for the board, Signal for gold.
const GREY = ["#111214", "#4A4C51", "#9A9CA1", "#D9D7D0", "#FFFFFF"];
const GOLD = ["#111214", "#8A7400", "#E2BB00", "#FFD400", "#FFF1A6"];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

type Cell = { gx: number; gy: number; h: number; row: number; t: number };

/**
 * The cells: each market a zigzag band running across the screen (depth gx + gy = 2r or 2r + 1),
 * time along the screen (gx - gy), the column's height its close in that market's own range.
 */
function build(d: RidgeData, SPAN: number) {
  const n = d.days.length;
  const R = d.rows.length;
  const cells: Cell[] = [];
  d.rows.forEach((r, row) => {
    const lo = Math.min(...r.closes);
    const hi = Math.max(...r.closes);
    for (let a = -SPAN; a <= SPAN; a++)
      for (const dd of [2 * row, 2 * row + 1]) {
        if ((a + dd) % 2) continue;
        const t = Math.round(((a + SPAN) / (2 * SPAN)) * (n - 1));
        const v = (r.closes[t]! - lo) / (hi - lo || 1);
        cells.push({ gx: (a + dd) / 2, gy: (dd - a) / 2, h: 0.6 + v * HMAX * (row === R - 1 ? 1.25 : 0.75 + 0.25 * (row / R)), row, t });
      }
  });
  cells.sort((p, q) => p.gx + p.gy - (q.gx + q.gy));
  return cells;
}

/** A cell's three visible faces in screen units of `u`, origin (ox, oy) = world (0, 0, 0). */
function facesOf(c: Cell, u: number, ox: number, oy: number) {
  const pt = (x: number, y: number, z: number): [number, number] => [ox + (x - y) * C * u, oy + ((x + y) * S - z) * u];
  const { gx: x, gy: y, h } = c;
  return {
    top: [pt(x, y, h), pt(x + 1, y, h), pt(x + 1, y + 1, h), pt(x, y + 1, h)],
    left: [pt(x, y + 1, 0), pt(x + 1, y + 1, 0), pt(x + 1, y + 1, h), pt(x, y + 1, h)],
    right: [pt(x + 1, y, 0), pt(x + 1, y + 1, 0), pt(x + 1, y + 1, h), pt(x + 1, y, h)],
  };
}

const inside = (p: [number, number], poly: [number, number][]) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};

/**
 * The hero: the whole board as an isometric terrain in ordered dither. Each band is a market,
 * each column a day's close in that market's range, gold in Signal at the front. It draws in left
 * to right; hovering a column outlines it and prints the market, the day and the exact close.
 */
export function HeroRidge({ d, className }: { d: RidgeData; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cvs = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<[number, number] | null>(null);
  const [hot, setHot] = useState<Cell | null>(null);
  const R = d.rows.length;

  useEffect(() => {
    const el = wrap.current!;
    const ro = new ResizeObserver(([e]) => setSize([e!.contentRect.width, e!.contentRect.height]));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Time columns either side of the centre: fewer on a phone, so the cubes stay legible.
  const span = size && size[0] < 640 ? 11 : 28;
  const cells = useMemo(() => build(d, span), [d, span]);
  // The field spans the full width (a = 0 mid screen); the front row's floor sits on the bottom edge.
  const geo = useMemo(() => {
    if (!size) return null;
    const [w, h] = size;
    const u = w / ((2 * span + 1) * C);
    return { u, ox: w / 2, oy: h - 2 * R * S * u, w, h };
  }, [size, R, span]);

  useEffect(() => {
    if (!geo) return;
    const w = Math.ceil(geo.w / PX);
    const h = Math.ceil(geo.h / PX);
    const c = cvs.current!;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, w, h);
    const u = geo.u / PX;
    const ox = geo.ox / PX;
    const oy = geo.oy / PX;
    // Pass 1: faces in two channels, R = how lit, G = which palette.
    for (const cell of cells) {
      const f = facesOf(cell, u, ox, oy);
      const g = cell.row === R - 1 ? 255 : 0;
      const far = 1 - cell.row / R; // back rows fade toward paper
      const lit = (v: number) => Math.round(Math.min(1, v + far * 0.25) * 255);
      const fill = (poly: [number, number][], top: number, bottom: number) => {
        const ys = poly.map((p) => p[1]);
        const grad = ctx.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
        grad.addColorStop(0, `rgb(${lit(top)},${g},0)`);
        grad.addColorStop(1, `rgb(${lit(bottom)},${g},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fill();
      };
      fill(f.top, 0.95, 0.8);
      fill(f.left, 0.66, 0.34);
      fill(f.right, 0.28, 0.06);
      // Ink edges, as the landing's iso kit draws them; they dither to solid Ink.
      ctx.strokeStyle = `rgb(0,${g},0)`;
      ctx.lineWidth = 1;
      for (const poly of [f.top, f.left, f.right]) {
        ctx.beginPath();
        poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.stroke();
      }
    }
    // Pass 2: ordered dither into the palette.
    const img = ctx.getImageData(0, 0, w, h);
    const px = img.data;
    const pals = [GREY.map(rgb), GOLD.map(rgb)];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        if (px[o + 3]! < 128) {
          px[o + 3] = 0;
          continue;
        }
        const pal = pals[px[o + 1]! > 127 ? 1 : 0]!;
        const v = px[o]! / 255;
        const q = Math.max(0, Math.min(pal.length - 1, Math.floor(v * (pal.length - 1) + BAYER[(y % 4) * 4 + (x % 4)]!)));
        const [r, g, b] = pal[q]!;
        px[o] = r!;
        px[o + 1] = g!;
        px[o + 2] = b!;
        px[o + 3] = 255;
      }
    ctx.putImageData(img, 0, 0);
  }, [geo, cells, R]);

  const outline = hot && geo ? facesOf(hot, geo.u, geo.ox, geo.oy) : null;
  const row = hot ? d.rows[hot.row]! : null;

  return (
    <div
      ref={wrap}
      className={className}
      onPointerMove={(e) => {
        if (!geo) return;
        const r = e.currentTarget.getBoundingClientRect();
        const p: [number, number] = [e.clientX - r.left, e.clientY - r.top];
        // Front to back: the first column whose faces hold the point.
        for (let i = cells.length - 1; i >= 0; i--) {
          const f = facesOf(cells[i]!, geo.u, geo.ox, geo.oy);
          if (inside(p, f.top) || inside(p, f.left) || inside(p, f.right)) return setHot(cells[i]!);
        }
        setHot(null);
      }}
      onPointerLeave={() => setHot(null)}
    >
      <canvas ref={cvs} aria-hidden className="hr-draw absolute inset-0 h-full w-full [image-rendering:pixelated]" />
      {outline && row && hot && geo && (
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full">
          {[outline.top, outline.left, outline.right].map((poly, k) => (
            <polygon key={k} points={poly.map((q) => q.join(",")).join(" ")} fill={k === 0 ? "#FFD400" : "none"} stroke="#111214" strokeWidth={1.2} />
          ))}
          {(() => {
            const [x, y] = outline.top[0]!;
            const flip = x > geo.w * 0.7;
            return (
              <g fontFamily="var(--font-tv-mono)" fontSize={11} letterSpacing="0.06em">
                <line x1={x} y1={y} x2={x} y2={y - 34} stroke="#111214" />
                <rect x={flip ? x - 176 : x} y={y - 72} width={176} height={38} fill="#FFFFFF" stroke="#111214" />
                <text x={flip ? x - 8 : x + 8} y={y - 56} textAnchor={flip ? "end" : "start"} fill="#111214" fontWeight={600}>
                  {row.sym} {row.fmt[hot.t]}
                </text>
                <text x={flip ? x - 8 : x + 8} y={y - 42} textAnchor={flip ? "end" : "start"} fill="#5D5F64">
                  {d.days[hot.t]}
                </text>
              </g>
            );
          })()}
        </svg>
      )}
    </div>
  );
}
