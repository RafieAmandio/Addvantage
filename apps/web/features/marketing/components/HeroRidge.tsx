"use client";

import { useEffect, useRef, useState } from "react";
import type { RidgeData } from "@/features/marketing/lib/landing";
import "./hero-ridge.css";

const PX = 4; // one dither pixel, in CSS px

// Back to front: a pale range, a grey range, then gold in Signal and Ink. Dark to light.
const PALETTES = [
  ["#C9C7C0", "#DCDAD3", "#E9E7E1"],
  ["#5D5F64", "#9A9CA1", "#CFCDC6"],
  ["#111214", "#3A3C40", "#FFD400", "#FFE87A"],
];
// Where each ridge sits: its highest and lowest point, as a share of the height.
const BANDS: [number, number][] = [
  [0.02, 0.42],
  [0.1, 0.6],
  [0.16, 0.95],
];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
function noise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
// Ridged fbm, stretched tall: reads as gullies running down the slopes.
const gully = (x: number, y: number) => {
  let s = 0;
  let amp = 0.55;
  let f = 1;
  for (let o = 0; o < 3; o++) {
    s += amp * (1 - Math.abs(2 * noise(x * f, y * f) - 1));
    amp *= 0.5;
    f *= 2.1;
  }
  return s;
};
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** A series resampled to `w` columns and placed in its band, top = highest close. In dither pixels. */
function ridgeLine(series: number[], w: number, h: number, [top, bottom]: [number, number]) {
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  const out = new Float32Array(w);
  for (let x = 0; x < w; x++) {
    const t = (x / (w - 1)) * (series.length - 1);
    const i = Math.floor(t);
    const v = series[i]! + (series[Math.min(i + 1, series.length - 1)]! - series[i]!) * (t - i);
    out[x] = h * (top + (bottom - top) * (1 - (v - lo) / (hi - lo || 1)));
  }
  return out;
}

/**
 * The hero's landscape, Browserbase style: three mountain ranges in ordered dither, the front one
 * gold's real daily closes. It draws in left to right; a cursor rides the gold ridge (the last
 * close at rest, the day under the pointer on hover) and prints that day's close.
 */
export function HeroRidge({ d, className }: { d: RidgeData; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cvs = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<[number, number] | null>(null);
  const [hot, setHot] = useState<number | null>(null);
  const [ridge, setRidge] = useState<Float32Array | null>(null);

  useEffect(() => {
    const el = wrap.current!;
    const ro = new ResizeObserver(([e]) => setSize([Math.ceil(e!.contentRect.width / PX), Math.ceil(e!.contentRect.height / PX)]));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!size) return;
    const [w, h] = size;
    const c = cvs.current!;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    const img = ctx.createImageData(w, h);
    const lines = [d.back, d.mid, d.front].map((s, k) => ridgeLine(s, w, h, BANDS[k]!));
    const pal = PALETTES.map((p) => p.map(rgb));
    for (let x = 0; x < w; x++)
      for (let y = 0; y < h; y++) {
        let k = -1;
        for (let j = 2; j >= 0; j--)
          if (y >= lines[j]![x]!) {
            k = j;
            break;
          }
        if (k < 0) continue;
        const r = lines[k]!;
        const below = (y - r[x]!) / h;
        // Light from the upper left: slopes rising to the right are lit.
        const slope = (r[Math.max(0, x - 2)]! - r[Math.min(w - 1, x + 2)]!) / 4;
        const g = gully(x * 0.09 + k * 31, y * 0.022 + k * 17);
        let v = 0.42 + 0.55 * g + slope * 0.22 - below * (k === 2 ? 1.6 : 1.1);
        if (y - r[x]! < 1.2) v += 0.35; // a lit crest line
        const p = pal[k]!;
        const q = Math.max(0, Math.min(p.length - 1, Math.floor(v * (p.length - 1) + BAYER[(y % 4) * 4 + (x % 4)]! - 0.25)));
        img.data.set([...p[q]!, 255], (y * w + x) * 4);
      }
    ctx.putImageData(img, 0, 0);
    setRidge(lines[2]!);
  }, [size, d]);

  const n = d.days.length;
  const i = hot ?? n - 1;
  const W = size ? size[0] : 0;
  const cx = ridge && W ? ((i / (n - 1)) * (W - 1) + 0.5) * PX : 0;
  const cy = ridge && W ? ridge[Math.round((i / (n - 1)) * (W - 1))]! * PX : 0;
  const day = d.days[i]!;
  const flip = cx > (W * PX) / 2;

  return (
    <div
      ref={wrap}
      className={className}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setHot(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1)))));
      }}
      onPointerLeave={() => setHot(null)}
    >
      <canvas ref={cvs} aria-hidden className="hr-draw absolute inset-0 h-full w-full [image-rendering:pixelated]" />
      {ridge && (
        <div aria-hidden className="hr-cursor pointer-events-none absolute inset-0">
          <span className="absolute top-0 w-px bg-tv-ink/60" style={{ left: cx, height: cy }} />
          <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 border border-tv-ink bg-tv-signal" style={{ left: cx, top: cy }} />
          <span
            className="absolute whitespace-nowrap border border-tv-ink bg-tv-white px-2 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-tv-ink"
            style={{ left: flip ? undefined : cx + 10, right: flip ? W * PX - cx + 10 : undefined, top: Math.max(0, cy - 44) }}
          >
            <span className="text-tv-mute">{day.d}</span> {d.sym} {day.c}
          </span>
        </div>
      )}
    </div>
  );
}
