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
// Gold under the spotlight: everything a step brighter.
const LIT = ["#3A3C40", "#E2BB00", "#FFE87A", "#FFF6CC"];
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

/** One range dithered into its own canvas (transparent above its ridge). */
function paint(c: HTMLCanvasElement, line: Float32Array, k: number, w: number, h: number, palette: string[]) {
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const p = palette.map(rgb);
  for (let x = 0; x < w; x++)
    for (let y = Math.max(0, Math.floor(line[x]!)); y < h; y++) {
      const below = (y - line[x]!) / h;
      // Light from the upper left: slopes rising to the right are lit.
      const slope = (line[Math.max(0, x - 2)]! - line[Math.min(w - 1, x + 2)]!) / 4;
      const g = gully(x * 0.09 + k * 31, y * 0.022 + k * 17);
      let v = 0.42 + 0.55 * g + slope * 0.22 - below * (k === 2 ? 1.6 : 1.1);
      if (y - line[x]! < 1.2) v += 0.35; // a lit crest line
      const q = Math.max(0, Math.min(p.length - 1, Math.floor(v * (p.length - 1) + BAYER[(y % 4) * 4 + (x % 4)]! - 0.25)));
      img.data.set([...p[q]!, 255], (y * w + x) * 4);
    }
  ctx.putImageData(img, 0, 0);
}

const calm = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The hero's landscape, Browserbase style: three mountain ranges in ordered dither, the front one
 * gold's real daily closes. The ranges drift against the pointer and the scroll at their own depth.
 * Over the gold ridge sits a chart crosshair (price on the right edge, date on the floor) with a
 * spotlight that brightens the gold under it; a click marks a level at that close. On load the
 * crosshair replays the series, then parks on the last close.
 */
export function HeroRidge({ d, className }: { d: RidgeData; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const layers = [useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null)];
  const lit = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<[number, number] | null>(null); // css px
  const [hot, setHot] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const [mark, setMark] = useState<number | null>(null);
  const [ridge, setRidge] = useState<Float32Array | null>(null);
  const n = d.days.length;
  const [replay, setReplay] = useState<number | null>(0);

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

  // The intro: the crosshair runs the series once, in step with the wipe, then hands over.
  useEffect(() => {
    if (calm()) return setReplay(null);
    const t0 = performance.now() + 200;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, Math.max(0, (t - t0) / 1600));
      const e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
      setReplay(k >= 1 ? null : Math.round(e * (n - 1)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [n]);

  useEffect(() => {
    if (!size) return;
    const w = Math.ceil((size[0] * (1 + 2 * OVER)) / PX);
    const h = Math.ceil(size[1] / PX);
    const lines = [d.back, d.mid, d.front].map((s, k) => ridgeLine(s, w, h, BANDS[k]!));
    lines.forEach((line, k) => paint(layers[k]!.current!, line, k, w, h, PALETTES[k]!));
    paint(lit.current!, lines[2]!, 2, w, h, LIT);
    setRidge(lines[2]!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, d]);

  // Screen position of day i on the gold ridge, in CSS px of the wrapper.
  const at = (i: number) => {
    if (!ridge || !size) return [0, 0] as const;
    const w = ridge.length;
    const col = Math.round(((i / (n - 1)) * (1 - 2 * OVER) + OVER) * (w - 1));
    return [(col + 0.5) * PX - size[0] * OVER, ridge[col]! * PX] as const;
  };
  const idx = replay ?? hot ?? n - 1;
  const live = replay !== null || hot !== null; // at rest only the marker and its price show
  const [cx, cy] = at(idx);
  const day = d.days[idx]!;
  const [, my] = mark === null ? [0, 0] : at(mark);
  const W = size?.[0] ?? 0;
  const H = size?.[1] ?? 0;

  const pick = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const el = e.currentTarget;
    el.style.setProperty("--lx", `${x + r.width * OVER}px`); // the spotlight canvas starts OVER to the left
    el.style.setProperty("--ly", `${y}px`);
    if (e.pointerType === "mouse") {
      el.style.setProperty("--mx", ((x / r.width) - 0.5).toFixed(3));
      el.style.setProperty("--my", ((y / r.height) - 0.5).toFixed(3));
    }
    return Math.max(0, Math.min(n - 1, Math.round((x / r.width) * (n - 1))));
  };

  return (
    <div
      ref={wrap}
      className={`${className ?? ""} hr-root`}
      data-over={over || undefined}
      onPointerEnter={() => setOver(true)}
      onPointerMove={(e) => setHot(pick(e))}
      onPointerLeave={(e) => {
        setOver(false);
        setHot(null);
        e.currentTarget.style.setProperty("--mx", "0");
        e.currentTarget.style.setProperty("--my", "0");
      }}
      onPointerUp={(e) => setMark(pick(e))}
    >
      {layers.map((ref, k) => (
        <canvas
          key={k}
          ref={ref}
          aria-hidden
          className="hr-layer hr-draw absolute inset-y-0 h-full [image-rendering:pixelated]"
          style={{ left: `${-OVER * 100}%`, width: `${100 + 2 * OVER * 100}%`, ["--m" as string]: DEPTH[k]!.m, ["--s" as string]: DEPTH[k]!.s }}
        />
      ))}
      <canvas
        ref={lit}
        aria-hidden
        className="hr-lit absolute inset-y-0 h-full [image-rendering:pixelated]"
        style={{ left: `${-OVER * 100}%`, width: `${100 + 2 * OVER * 100}%` }}
      />
      {ridge && (
        <div aria-hidden className="hr-cursor pointer-events-none absolute inset-0 font-mono text-[11px] uppercase tracking-[0.06em]">
          {mark !== null && (
            <div className="hr-mark absolute inset-x-0" style={{ top: my }}>
              <span className="absolute inset-x-0 top-0 h-0.5 bg-tv-signal shadow-[0_0_0_1px_#111214]" />
              <span className="absolute right-0 top-0 -translate-y-1/2 border border-tv-ink bg-tv-signal px-1.5 py-0.5 text-tv-ink">
                Level {d.days[mark]!.c}
              </span>
            </div>
          )}
          {/* The crosshair: dashed lines through the point, the price on the right edge, the date on the floor. */}
          {live && <span className="absolute top-0 border-l border-dashed border-tv-ink/50" style={{ left: cx, height: H }} />}
          {live && <span className="absolute left-0 border-t border-dashed border-tv-ink/50" style={{ top: cy, width: W }} />}
          <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 border border-tv-ink bg-tv-signal" style={{ left: cx, top: cy }} />
          <span className="absolute right-0 -translate-y-1/2 bg-tv-ink px-1.5 py-0.5 text-tv-white" style={{ top: cy }}>
            {d.sym} {day.c}
          </span>
          {live && (
            <span className="absolute bottom-2 -translate-x-1/2 whitespace-nowrap bg-tv-ink px-1.5 py-0.5 text-tv-white" style={{ left: Math.min(Math.max(cx, 60), W - 60) }}>
              {day.d}
            </span>
          )}
          <span className="hr-hint absolute bottom-2 left-3 text-tv-white mix-blend-difference">Click to mark a level</span>
        </div>
      )}
    </div>
  );
}
