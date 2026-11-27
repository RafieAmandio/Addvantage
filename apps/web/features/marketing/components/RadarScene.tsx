"use client";

import { useEffect, useRef } from "react";
import { P, box, pts, type B } from "@/features/marketing/lib/iso";
import { Block, GrainDefs, type Face } from "@/features/marketing/components/iso/Iso";
import "@/features/auth/components/access-scene.css";

const U = 22;
const G = "tvg-radar";

// A watchtower on a rock in a voxel sea. Its lamp throws a Signal beam that sweeps the water;
// the wave tops it crosses light up gold for a moment, like a signal picked out of the noise.
const N = 30; // the sea, N by N voxel columns
const C0 = N / 2; // the tower's centre, on both axes
const ISLAND = 3.4;
const BEAM = 0.3; // half the beam's width, radians
const REACH = 15;

const rnd = (x: number, y: number) => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
// Swell: two crossing wave trains and a little chop, in whole voxels.
const swell = (x: number, y: number) => Math.sin(x * 0.55 + y * 0.22) + 0.3 * Math.sin(y * 0.7 - x * 0.3 + 1.7) + (rnd(x, y) - 0.5) * 0.35;

type Part = { b: B; face: Face; roof?: true };
const parts: Part[] = [];
for (let x = 0; x < N; x++)
  for (let y = 0; y < N; y++) {
    const r = Math.hypot(x + 0.5 - C0, y + 0.5 - C0);
    if (r < ISLAND) {
      // Rock: higher toward the tower, graphite with pale ledges.
      // A flat summit of 5 under the tower, falling away to the water.
      const h = r < 1.8 ? 5 : Math.min(5, 2 + Math.round((ISLAND - r) * 1.2 + rnd(x, y) * 1.2));
      parts.push({ b: box(x, y, 0, 1, 1, h), face: rnd(x + 4, y) < 0.35 ? "white" : "graphite" });
      continue;
    }
    const s = swell(x, y);
    const h = s > 0.75 ? 3 : s > -0.35 ? 2 : 1;
    parts.push({ b: box(x, y, 0, 1, 1, h), face: h === 3 ? "white" : "stone", roof: true });
  }
const T0 = C0 - 1.25;
const TOWER: Part[] = [
  { b: box(T0, T0, 5, 2.5, 2.5, 1), face: "white" },
  { b: box(T0 + 0.25, T0 + 0.25, 6, 2, 2, 3), face: "white" },
  { b: box(T0 + 0.25, T0 + 0.25, 9, 2, 2, 0.6), face: "ink" },
  { b: box(T0 + 0.35, T0 + 0.35, 9.6, 1.8, 1.8, 3), face: "white" },
  { b: box(T0 - 0.2, T0 - 0.2, 12.6, 2.9, 2.9, 0.4), face: "ink" },
  { b: box(T0 + 0.5, T0 + 0.5, 13, 1.5, 1.5, 1.3), face: "signal" },
  { b: box(T0 + 0.35, T0 + 0.35, 14.3, 1.8, 1.8, 0.5), face: "graphite" },
  { b: box(T0 + 0.8, T0 + 0.8, 14.8, 0.9, 0.9, 0.5), face: "graphite" },
];
const key = (b: B) => b[0] + b[2] + b[4];
const sea = parts.sort((a, b) => key(a.b) - key(b.b));
// The tower draws as one piece, after every column not past its base's front corner.
const at = 2 * (T0 + 2.5);
const behind = sea.filter((p) => p.b[0] + p.b[2] < at - 1);
const front = sea.filter((p) => p.b[0] + p.b[2] >= at - 1);
const LAMP = P(C0, C0, 13.7, U);
const CLOUDS: B[] = [box(2, 4, 19, 4, 2.4, 0.7), box(3, 4.5, 19.7, 2, 1.4, 0.6), box(22, -2, 21, 4.6, 2.6, 0.7), box(23, -1.4, 21.7, 2.2, 1.4, 0.6)];

// Framed tight on the tower so the sea runs off every edge but the far corner, the horizon.
const [cxs] = P(C0, C0, 0, U);
const VH = 27 * U;
const VW = VH * 0.82;
const minX = cxs - VW / 2;
const minY = LAMP[1] - VH * 0.24;

const topFace = (b: B) => pts([[b[0], b[2], b[5]], [b[1], b[2], b[5]], [b[1], b[3], b[5]], [b[0], b[3], b[5]]], U);
const angleOf = (b: B) => Math.atan2(b[2] + 0.5 - C0, b[0] + 0.5 - C0);
const distOf = (b: B) => Math.hypot(b[2] + 0.5 - C0, b[0] + 0.5 - C0);

// A wave top lights only if nothing in front stands taller, so the overlay never paints gold over a crest.
const H = new Map(parts.map((p) => [`${p.b[0]},${p.b[2]}`, p.b[5]]));
const lit = parts.filter(
  (p) => p.roof && [0, 1, 2].every((i) => [0, 1, 2].every((j) => (i || j ? (H.get(`${p.b[0] + i},${p.b[2] + j}`) ?? 0) <= p.b[5] : true))),
);
const litBehind = lit.filter((p) => p.b[0] + p.b[2] < at - 1);
const litFront = lit.filter((p) => p.b[0] + p.b[2] >= at - 1);

const Tower = () => (
  <>
    {TOWER.map((p, k) => (
      <Block key={k} b={p.b} u={U} face={p.face} grain={G} />
    ))}
  </>
);

/**
 * The positioning figure, in the auth pages' kit: a watchtower on a rock in a voxel sea, its
 * Signal beam sweeping round; the wave tops it crosses light gold and fade.
 *
 * Built for speed: the sea is a still picture on its own compositor layer (painted once), and
 * parallax moves whole layers, never repaints them. Only the overlay (beam, lit tops, a copy of
 * the tower to keep tops behind it hidden) repaints, and only while the section is on screen.
 * With reduced motion the beam holds still.
 */
export function RadarScene({ className }: { className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const beam = useRef<SVGPolygonElement>(null);
  const roofs = useRef(new Map<Part, SVGPolygonElement>());

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const on = new Map<Part, boolean>();
    let raf = 0;
    let a = -2.2;
    let last = performance.now();
    const draw = (now: number) => {
      a += still ? 0 : (Math.min(now - last, 100) / 1000) * 0.45;
      last = now;
      const g = (d: number) => P(C0 + REACH * Math.cos(a + d), C0 + REACH * Math.sin(a + d), 0, U);
      const [l, r] = [g(-BEAM), g(BEAM)];
      beam.current?.setAttribute("points", `${LAMP.join(",")} ${l.join(",")} ${r.join(",")}`);
      roofs.current.forEach((el, p) => {
        const d = Math.atan2(Math.sin(angleOf(p.b) - a), Math.cos(angleOf(p.b) - a));
        const v = Math.abs(d) < BEAM && distOf(p.b) < REACH;
        if (on.get(p) !== v) el.toggleAttribute("data-on", v), on.set(p, v);
      });
      if (!still) raf = requestAnimationFrame(draw);
    };
    // Run only while the figure is on screen.
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e!.isIntersecting) (last = performance.now()), (raf = requestAnimationFrame(draw));
    });
    io.observe(wrap.current!);
    return () => (io.disconnect(), cancelAnimationFrame(raf));
  }, []);

  // Parallax as a direct transform per layer: a custom property on an ancestor would restyle all
  // ten thousand polygons on every pointer move.
  const set = (x: number, y: number) =>
    wrap.current?.querySelectorAll<HTMLElement>("[data-d]").forEach((el) => {
      const d = Number(el.dataset.d);
      el.style.transform = `translate(${(-x * d).toFixed(2)}px, ${(-y * d * 0.6).toFixed(2)}px)`;
    });
  const ref = (p: Part) => (el: SVGPolygonElement | null) => void (el ? roofs.current.set(p, el) : roofs.current.delete(p));
  const svg = { viewBox: `${minX} ${minY} ${VW} ${VH}`, preserveAspectRatio: "xMidYMid slice", className: "absolute inset-0 h-full w-full" };
  const layer = "absolute inset-[-24px] [will-change:transform] motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.23,1,0.32,1)]";
  const roof = (p: Part) => <polygon key={`${p.b[0]},${p.b[2]}`} ref={ref(p)} className="rd-roof" points={topFace(p.b)} fill="#FFD400" stroke="#111214" strokeWidth={0.9} vectorEffect="non-scaling-stroke" />;

  return (
    <div
      ref={wrap}
      aria-hidden
      className={className}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const r = e.currentTarget.getBoundingClientRect();
        set((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => set(0, 0)}
    >
      <div className={layer} data-d={22}>
        <svg {...svg}>
          <defs>
            <GrainDefs id={`${G}-c`} />
          </defs>
          <g className="as-cloud">
            {CLOUDS.map((b, k) => (
              <Block key={k} b={b} u={U} grain={`${G}-c`} />
            ))}
          </g>
        </svg>
      </div>
      <div className={layer} data-d={6}>
        {/* The still sea: painted once. */}
        <svg {...svg}>
          <defs>
            <GrainDefs id={G} />
          </defs>
          {behind.map((p, k) => (
            <Block key={k} b={p.b} u={U} face={p.face} grain={G} />
          ))}
          <Tower />
          {front.map((p, k) => (
            <Block key={k} b={p.b} u={U} face={p.face} grain={G} />
          ))}
        </svg>
        {/* The live overlay, on its own layer so its repaints never touch the sea. */}
        <svg {...svg} className={`${svg.className} [will-change:transform]`}>
          <defs>
            <linearGradient id={`${G}-beam`} gradientUnits="userSpaceOnUse" x1={LAMP[0]} y1={LAMP[1]} x2={LAMP[0]} y2={LAMP[1] + 24 * U}>
              <stop offset="0" stopColor="#FFD400" stopOpacity={0.55} />
              <stop offset="1" stopColor="#FFD400" stopOpacity={0.04} />
            </linearGradient>
            <style>{`.rd-roof{opacity:0;transition:opacity 900ms ease-out}.rd-roof[data-on]{opacity:1;transition-duration:150ms}`}</style>
          </defs>
          {litBehind.map(roof)}
          <Tower />
          {litFront.map(roof)}
          <polygon ref={beam} fill={`url(#${G}-beam)`} className="as-light" />
        </svg>
      </div>
    </div>
  );
}
