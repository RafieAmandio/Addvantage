"use client";

import { useEffect, useRef, useState } from "react";
import type { RidgeData } from "@/features/marketing/lib/landing";
import "./hero-ridge.css";

const PX = 4; // one dither pixel, in CSS px
const OVER = 0.04; // each layer is drawn this much wider on both sides, so parallax never shows an edge

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
// How far each layer drifts: against the pointer (px at the edge) and with the scroll (share of scrollY).
const DEPTH = [
  { m: 26, s: 0.32 },
  { m: 12, s: 0.16 },
  { m: 0, s: 0 },
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

/**
 * A series resampled to `w` columns and placed in its band, top = highest close. In dither pixels.
 * The series spans the visible part of the canvas; the overscan either side holds its end values.
 */
function ridgeLine(series: number[], w: number, h: number, [top, bottom]: [number, number]) {
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  const out = new Float32Array(w);
  for (let x = 0; x < w; x++) {
    const t = Math.min(1, Math.max(0, (x / (w - 1) - OVER) / (1 - 2 * OVER))) * (series.length - 1);
    const i = Math.floor(t);
    const v = series[i]! + (series[Math.min(i + 1, series.length - 1)]! - series[i]!) * (t - i);
    out[x] = h * (top + (bottom - top) * (1 - (v - lo) / (hi - lo || 1)));
  }
  return out;
}

/**
 * One range into its own canvas (transparent above its ridge): ordered dither, or `clean`, the same
 * shading blended smoothly between the palette's colours with no dither at all.
 */
function paint(c: HTMLCanvasElement, line: Float32Array, k: number, w: number, h: number, palette: string[], clean = false) {
  const small = document.createElement("canvas");
  small.width = w;
  small.height = h;
  const img = small.getContext("2d")!.createImageData(w, h);
  const p = palette.map(rgb);
  const top = p.length - 1;
  for (let x = 0; x < w; x++)
    for (let y = Math.max(0, Math.floor(line[x]!)); y < h; y++) {
      const below = (y - line[x]!) / h;
      // Light from the upper left: slopes rising to the right are lit.
      const slope = (line[Math.max(0, x - 2)]! - line[Math.min(w - 1, x + 2)]!) / 4;
      const g = gully(x * 0.09 + k * 31, y * 0.022 + k * 17);
      let v = 0.42 + 0.55 * g + slope * 0.22 - below * (k === 2 ? 1.6 : 1.1);
      if (y - line[x]! < 1.2) v += 0.35; // a lit crest line
      const o = (y * w + x) * 4;
      if (clean) {
        const t = Math.max(0, Math.min(top, v * top - 0.25 + 0.5));
        const i = Math.min(top - 1, Math.floor(t));
        const f = t - i;
        img.data.set([0, 1, 2].map((ch) => p[i]![ch]! + (p[i + 1]![ch]! - p[i]![ch]!) * f).concat(255), o);
      } else {
        const q = Math.max(0, Math.min(top, Math.floor(v * top + BAYER[(y % 4) * 4 + (x % 4)]! - 0.25)));
        img.data.set([...p[q]!, 255], o);
      }
    }
  small.getContext("2d")!.putImageData(img, 0, 0);
  // Drawn at full resolution in whole device pixels per dither pixel, so the browser never
  // resamples the dither when the layer moves; a fractional parallax offset just glides.
  const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
  c.width = w * PX * dpr;
  c.height = h * PX * dpr;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = clean;
  ctx.drawImage(small, 0, 0, c.width, c.height);
}

/**
 * The hero's landscape, Browserbase style: three mountain ranges in ordered dither, the front one
 * gold's real daily closes. The ranges drift against the pointer and the scroll at their own depth.
 * Under the pointer a lens clears the noise: the dither resolves into smooth shading.
 */
export function HeroRidge({ d, className }: { d: RidgeData; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const layers = [useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null)];
  const clear = [useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null)];
  const [size, setSize] = useState<[number, number] | null>(null); // css px
  const [over, setOver] = useState(false);

  useEffect(() => {
    const el = wrap.current!;
    const ro = new ResizeObserver(([e]) => setSize([e!.contentRect.width, e!.contentRect.height]));
    ro.observe(el);
    // Scroll parallax: one custom property, the layers read it in CSS.
    const onScroll = () => el.style.setProperty("--scroll", String(Math.min(window.scrollY, 900)));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!size) return;
    const w = Math.ceil((size[0] * (1 + 2 * OVER)) / PX);
    const h = Math.ceil(size[1] / PX);
    const lines = [d.back, d.mid, d.front].map((s, k) => ridgeLine(s, w, h, BANDS[k]!));
    lines.forEach((line, k) => {
      paint(layers[k]!.current!, line, k, w, h, PALETTES[k]!);
      paint(clear[k]!.current!, line, k, w, h, PALETTES[k]!, true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, d]);

  // Exact CSS size, a whole number of dither pixels, so a dither pixel is always PX by PX.
  const cw = size ? Math.ceil((size[0] * (1 + 2 * OVER)) / PX) * PX : 0;
  const ch = size ? Math.ceil(size[1] / PX) * PX : 0;
  const layerStyle = (k: number) => ({ left: size ? -Math.round(size[0] * OVER) : 0, width: cw, height: ch, ["--m" as string]: DEPTH[k]!.m, ["--s" as string]: DEPTH[k]!.s });

  return (
    <div
      ref={wrap}
      className={`${className ?? ""} hr-root`}
      data-over={over || undefined}
      onPointerEnter={() => setOver(true)}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const el = e.currentTarget;
        el.style.setProperty("--lx", `${x}px`);
        el.style.setProperty("--ly", `${y}px`);
        if (e.pointerType === "mouse") {
          el.style.setProperty("--mx", (x / r.width - 0.5).toFixed(3));
          el.style.setProperty("--my", (y / r.height - 0.5).toFixed(3));
        }
      }}
      onPointerLeave={(e) => {
        setOver(false);
        e.currentTarget.style.setProperty("--mx", "0");
        e.currentTarget.style.setProperty("--my", "0");
      }}
    >
      {layers.map((ref, k) => (
        <canvas key={k} ref={ref} aria-hidden className="hr-layer hr-draw absolute top-0" style={layerStyle(k)} />
      ))}
      <div aria-hidden className="hr-lens pointer-events-none absolute inset-0">
        {clear.map((ref, k) => (
          <canvas key={k} ref={ref} className="hr-layer absolute top-0" style={layerStyle(k)} />
        ))}
      </div>
    </div>
  );
}
