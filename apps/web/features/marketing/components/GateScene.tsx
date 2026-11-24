"use client";

import { useEffect, useRef, useState } from "react";
import "./hero-ridge.css";

const PX = 4; // one dither pixel, in CSS px
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16 - 0.5);
// Paper, stones, greys, ink, and Signal: the only colours the dither may land on.
const PALETTE = ["#F4F3EF", "#E6E5E0", "#D9D8D3", "#B9B8B2", "#8A8C91", "#6B6D72", "#3A3C40", "#111214", "#FFD400", "#FFE87A"].map((h) =>
  [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)),
);
const SPREAD = 30; // how far the Bayer offset pushes a colour before it snaps to the palette

/** The scene, drawn smooth at dither resolution: a Signal sun, a far range, a floor, an ink gate, one figure through it. */
function draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const hz = h * 0.6; // horizon
  const sky = ctx.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, "#F4F3EF");
  sky.addColorStop(0.55, "#F4F3EF");
  sky.addColorStop(1, "#DCDBD6");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, hz);

  const sx = w * 0.3, sy = h * 0.27, sr = w * 0.21;
  const sun = ctx.createRadialGradient(sx - sr * 0.35, sy - sr * 0.35, sr * 0.1, sx, sy, sr);
  sun.addColorStop(0, "#FFE87A");
  sun.addColorStop(1, "#FFD400");
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();

  // A far range across the horizon.
  ctx.beginPath();
  ctx.moveTo(0, hz);
  for (let x = 0; x <= w; x++) {
    const t = x / w;
    const y = hz - h * (0.05 + 0.035 * Math.sin(t * 9.1 + 1.3) + 0.02 * Math.sin(t * 23.7) + 0.05 * Math.exp(-((t - 0.78) ** 2) / 0.01));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, hz);
  const range = ctx.createLinearGradient(0, hz - h * 0.14, 0, hz);
  range.addColorStop(0, "#9A9CA1");
  range.addColorStop(1, "#C9C7C0");
  ctx.fillStyle = range;
  ctx.fill();

  // The floor, lighter at the horizon, with tiles in perspective.
  const floor = ctx.createLinearGradient(0, hz, 0, h);
  floor.addColorStop(0, "#E6E5E0");
  floor.addColorStop(1, "#B9B8B2");
  ctx.fillStyle = floor;
  ctx.fillRect(0, hz, w, h - hz);
  ctx.strokeStyle = "#8A8C91";
  const gx = w * 0.4, gb = h * 0.86, gw = w * 0.34, gh = h * 0.44, pw = w * 0.07, d0 = w * 0.035;
  const vx = gx + gw / 2;
  ctx.lineWidth = 1;
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(vx, hz);
    ctx.lineTo(vx + i * w * 0.32, h);
    ctx.stroke();
  }
  for (let k = 1; k < 9; k++) {
    const y = hz + (h - hz) * (k / 8) ** 2.2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // The gate: two ink pillars and a lintel, lit from the left.
  const block = (x0: number, y0: number, bw0: number, bh0: number) => {
    // Whole pixels, so the faces meet without antialiased seams.
    const [x, y, bw, bh, d] = [x0, y0, bw0, bh0, d0].map(Math.round) as [number, number, number, number, number];
    ctx.fillStyle = "#3A3C40"; // side
    ctx.fillRect(x + bw, y - d, d, bh);
    ctx.fillStyle = "#8A8C91"; // top
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + d, y - d);
    ctx.lineTo(x + bw + d, y - d);
    ctx.lineTo(x + bw, y);
    ctx.fill();
    ctx.fillStyle = "#111214"; // face
    ctx.fillRect(x, y, bw, bh);
  };
  block(gx, gb - gh, pw, gh);
  block(gx + gw - pw, gb - gh, pw, gh);
  block(gx - w * 0.02, gb - gh - h * 0.06, gw + w * 0.04, h * 0.06);

  // One figure through the gate, small, in Signal; three stopped before it, in grey.
  const fig = (x: number, base: number, s: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x - s * 0.22, base - s, s * 0.44, s * 0.75);
    ctx.beginPath();
    ctx.arc(x, base - s * 1.12, s * 0.17, 0, Math.PI * 2);
    ctx.fill();
  };
  fig(gx + gw * 0.5, h * 0.75, h * 0.05, "#FFD400");
  fig(w * 0.3, h * 0.9, h * 0.07, "#6B6D72");
  fig(w * 0.19, h * 0.93, h * 0.075, "#8A8C91");
  fig(w * 0.08, h * 0.96, h * 0.08, "#8A8C91");
}

function paint(c: HTMLCanvasElement, w: number, h: number, clean: boolean) {
  const small = document.createElement("canvas");
  small.width = w;
  small.height = h;
  const sctx = small.getContext("2d")!;
  draw(sctx, w, h);
  if (!clean) {
    const img = sctx.getImageData(0, 0, w, h);
    const a = img.data;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        const off = BAYER[(y % 4) * 4 + (x % 4)]! * SPREAD;
        let best = 0;
        let bd = Infinity;
        for (let i = 0; i < PALETTE.length; i++) {
          const p = PALETTE[i]!;
          const dd = (a[o]! + off - p[0]!) ** 2 + (a[o + 1]! + off - p[1]!) ** 2 + (a[o + 2]! + off - p[2]!) ** 2;
          if (dd < bd) [bd, best] = [dd, i];
        }
        a.set(PALETTE[best]!, o);
      }
    sctx.putImageData(img, 0, 0);
  }
  const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
  c.width = w * PX * dpr;
  c.height = h * PX * dpr;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = clean;
  ctx.drawImage(small, 0, 0, c.width, c.height);
}

/** The positioning scene, in the hero's dither: a gate with one trader through it. The same lens clears the noise. */
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
