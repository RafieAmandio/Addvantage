"use client";

import { useEffect, useRef, useState } from "react";
import { P, box, faces, hull, type B } from "@/features/marketing/lib/iso";
import "./hero-ridge.css";

const PX = 4; // one dither pixel, in CSS px
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
// Dark to light. Grey for the world, Signal for the one that passes (and the sun).
const GREY = ["#111214", "#3A3C40", "#6B6D72", "#9A9CA1", "#C9C7C0", "#E6E5E0", "#F4F3EF"].map(rgb);
const GOLD = ["#111214", "#8A7400", "#E2BB00", "#FFD400", "#FFE87A", "#FFF6C8"].map(rgb);

// The world, in cube units: a lane on an endless floor, a gate across it, a queue stopped before it.
const LANE = box(-6, 0.2, 0, 18, 3.6, 0.25);
const GX = 9;
const PILLARS = [box(GX, -0.5, 0, 0.7, 0.7, 4.6), box(GX, 3.8, 0, 0.7, 0.7, 4.6)];
const LINTEL = box(GX - 0.15, -0.65, 4.6, 1, 5.3, 0.7);
const STOPPED = [box(3.9, 1.15, 0.25, 1.7, 1.7, 1.5), box(1.2, 1.15, 0.25, 1.7, 1.7, 2), box(-1.5, 1.15, 0.25, 1.7, 1.7, 1.25)];
const PASSED = box(12.2, 1, 0.25, 2, 2, 2.4);

type Pt = [number, number];

/**
 * The scene, smooth, at dither resolution, in two channels: R = how lit, G = which ramp.
 * Ink edges are lightness 0, so they dither to solid Ink like the landing's iso kit.
 */
function draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Fit the queue to the passed block across the width, the passed block's foot near the bottom.
  const u = w / 17.5;
  const ox = w / 2 - 3.8 * u;
  const oy = h * 0.88 - 8.6 * u;
  const pt = (x: number, y: number, z: number): Pt => {
    const [sx, sy] = P(x, y, z, u);
    return [ox + sx, oy + sy];
  };
  const col = (l: number, gold: boolean) => `rgb(${Math.round(Math.max(0, Math.min(1, l)) * 255)},${gold ? 255 : 0},0)`;
  const poly = (ps: Pt[], l0: number, l1: number, gold = false, edge = false) => {
    const ys = ps.map((p) => p[1]);
    const g = ctx.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys) + 0.01);
    g.addColorStop(0, col(l0, gold));
    g.addColorStop(1, col(l1, gold));
    ctx.fillStyle = g;
    ctx.beginPath();
    ps.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
    if (edge) {
      ctx.strokeStyle = col(0, gold);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };
  const line = (a: Pt, b: Pt, l: number, width = 1) => {
    ctx.strokeStyle = col(l, false);
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  };
  const solid = (b: B, gold = false, tone = 0) => {
    for (const f of faces(b)) {
      const ps = f.pts.map((p) => pt(p[0], p[1], p[2]));
      if (f.top) poly(ps, 0.96 - tone, 0.86 - tone, gold, true);
      else if (f.shade < 0.5) poly(ps, 0.7 - tone, 0.42 - tone, gold, true);
      else poly(ps, 0.34 - tone, 0.12 - tone, gold, true);
    }
  };
  // A block's shadow on its floor, thrown down-right (light from the upper left).
  const shadow = (b: B) => {
    const len = (b[5] - b[4]) * 0.8;
    poly(hull(box(b[0], b[2], b[4], b[1] - b[0] + len, b[3] - b[2], 0), u).map(([x, y]) => [ox + x, oy + y] as Pt), 0.55, 0.55);
  };

  // Sky and a Signal sun.
  poly([[0, 0], [w, 0], [w, h], [0, h]], 1, 0.9);
  const sx = w * 0.27, sy = h * 0.15, sr = w * 0.17;
  const sun = ctx.createRadialGradient(sx - sr * 0.4, sy - sr * 0.4, 0, sx, sy, sr);
  sun.addColorStop(0, col(0.98, true));
  sun.addColorStop(1, col(0.62, true));
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();

  // The floor: an endless slab, its far corner the horizon, with a tile grid.
  const F = 60, back = -5;
  poly([pt(back, back, 0), pt(F, back, 0), pt(F, F, 0), pt(back, F, 0)], 0.86, 0.66);
  for (let i = back; i <= 40; i += 2) {
    line(pt(i, back, 0), pt(i, F, 0), 0.6);
    line(pt(back, i, 0), pt(F, i, 0), 0.6);
  }

  // Back to front.
  solid(LANE, false, 0.08);
  const queue = [...STOPPED].reverse();
  queue.forEach(shadow);
  queue.forEach((b) => {
    solid(b, false, 0.05);
    // Struck: an ink stroke across the top face.
    line(pt(b[0] + 0.25, b[3] - 0.25, b[5]), pt(b[1] - 0.25, b[2] + 0.25, b[5]), 0, 2);
  });
  PILLARS.forEach(shadow);
  PILLARS.forEach((b) => solid(b, false, 0.62));
  solid(LINTEL, false, 0.62);
  shadow(PASSED);
  solid(PASSED, true);
}

/** Lightness to colour: ordered dither on its ramp, or `clean`, a smooth blend along it. */
function paint(c: HTMLCanvasElement, w: number, h: number, clean: boolean) {
  const small = document.createElement("canvas");
  small.width = w;
  small.height = h;
  const sctx = small.getContext("2d")!;
  draw(sctx, w, h);
  const img = sctx.getImageData(0, 0, w, h);
  const a = img.data;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      const ramp = a[o + 1]! > 127 ? GOLD : GREY;
      const top = ramp.length - 1;
      const v = (a[o]! / 255) * top;
      if (clean) {
        const i = Math.min(top - 1, Math.floor(v));
        const f = v - i;
        a.set([0, 1, 2].map((ch) => ramp[i]![ch]! + (ramp[i + 1]![ch]! - ramp[i]![ch]!) * f), o);
      } else a.set(ramp[Math.max(0, Math.min(top, Math.floor(v + BAYER[(y % 4) * 4 + (x % 4)]! - 0.25)))]!, o);
      a[o + 3] = 255;
    }
  sctx.putImageData(img, 0, 0);
  const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
  c.width = w * PX * dpr;
  c.height = h * PX * dpr;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = clean;
  ctx.drawImage(small, 0, 0, c.width, c.height);
}

/** The positioning scene in the hero's dither: an isometric gate, the queue stopped, one Signal block through. */
export function GateScene({ className }: { className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const dith = useRef<HTMLCanvasElement>(null);
  const clean = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<[number, number] | null>(null);
  const [over, setOver] = useState(false);

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setSize([e!.contentRect.width, e!.contentRect.height]));
    ro.observe(wrap.current!);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!size) return;
    const w = Math.ceil(size[0] / PX);
    const h = Math.ceil(size[1] / PX);
    paint(dith.current!, w, h, false);
    paint(clean.current!, w, h, true);
  }, [size]);

  const style = size ? { width: Math.ceil(size[0] / PX) * PX, height: Math.ceil(size[1] / PX) * PX } : undefined;
  return (
    <div
      ref={wrap}
      className={`${className ?? ""} hr-root relative overflow-hidden`}
      data-over={over || undefined}
      onPointerEnter={() => setOver(true)}
      onPointerLeave={() => setOver(false)}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--lx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--ly", `${e.clientY - r.top}px`);
      }}
    >
      <canvas ref={dith} aria-hidden className="hr-draw absolute left-0 top-0" style={style} />
      <div aria-hidden className="hr-lens pointer-events-none absolute inset-0">
        <canvas ref={clean} className="absolute left-0 top-0" style={style} />
      </div>
    </div>
  );
}
