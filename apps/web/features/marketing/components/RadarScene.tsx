"use client";

import { useEffect, useRef } from "react";
import { P, box, pts, type B } from "@/features/marketing/lib/iso";
import { Block, GrainDefs, type Face } from "@/features/marketing/components/iso/Iso";
import "@/features/auth/components/access-scene.css";

const U = 30;
const G = "tvg-radar";

// A block city around a radar tower on a cleared plaza. The tower's lamp throws a Signal beam
// that sweeps the city; the roofs it passes light up gold for a moment, like a signal picked up.
const CELL = 2;
const N = 11;
const TC = 5; // the tower's cell, on both axes
const TX = TC * CELL + CELL / 2;
const BEAM = 0.32; // half the beam's width, radians
const REACH = 13;

const rnd = (x: number, y: number) => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

type Part = { b: B; face: Face; roof?: true; tower?: true };
const parts: Part[] = [];
for (let cx = 0; cx < N; cx++)
  for (let cy = 0; cy < N; cy++) {
    const r = Math.max(Math.abs(cx - TC), Math.abs(cy - TC));
    if (r <= 1) continue; // the plaza
    const h = Math.max(0, Math.min(3, Math.round(r * 0.3 + rnd(cx, cy) * 1.7 - 0.7)));
    for (let z = 0; z < h; z++)
      parts.push({ b: box(cx * CELL, cy * CELL, z * CELL, CELL, CELL, CELL), face: rnd(cx * 7 + z, cy * 3 + z) < 0.12 ? "graphite" : "white", roof: z === h - 1 || undefined });
    if (h > 0 && rnd(cx + 11, cy + 5) < 0.3) {
      const o = rnd(cx, cy + 9) < 0.5 ? 0 : 1;
      parts.push({ b: box(cx * CELL + o, cy * CELL, h * CELL, 1, 1, 1), face: rnd(cx + 3, cy + 1) < 0.3 ? "graphite" : "white" });
    }
  }
const TOWER: Part[] = [
  { b: box(TX - 1.6, TX - 1.6, 0, 3.2, 3.2, 1.2), face: "white", tower: true },
  { b: box(TX - 1, TX - 1, 1.2, 2, 2, 1), face: "graphite", tower: true },
  { b: box(TX - 0.4, TX - 0.4, 2.2, 0.8, 0.8, 8.4), face: "ink", tower: true },
  { b: box(TX - 1.1, TX - 1.1, 10.6, 2.2, 2.2, 1.5), face: "graphite", tower: true },
  { b: box(TX - 0.5, TX - 0.5, 12.1, 1, 1, 0.8), face: "signal", tower: true },
];
const key = (b: B) => b[0] + b[2] + b[4];
const city = parts.sort((a, b) => key(a.b) - key(b.b));
// The tower draws as one piece: after every block whose footprint is not past its plinth's front corner.
const at = 2 * (TX + 1.6);
const behind = city.filter((p) => key(p.b) < at);
const front = city.filter((p) => key(p.b) >= at);
const LAMP = P(TX, TX, 12.5, U);
const CLOUDS: B[] = [box(-2, 2, 15, 4, 2.4, 0.7), box(-1, 2.5, 15.7, 2, 1.4, 0.6), box(17, -3, 17, 4.6, 2.6, 0.7), box(18, -2.4, 17.7, 2.2, 1.4, 0.6)];

// Framed on the tower, the lamp a quarter down.
const VH = 30 * U;
const VW = VH * 0.82;
const minX = -VW / 2;
const minY = LAMP[1] - VH * 0.2;

const topFace = (b: B) => pts([[b[0], b[2], b[5]], [b[1], b[2], b[5]], [b[1], b[3], b[5]], [b[0], b[3], b[5]]], U);
const angleOf = (b: B) => Math.atan2((b[2] + b[3]) / 2 - TX, (b[0] + b[1]) / 2 - TX);

const Piece = ({ p, roofRef }: { p: Part; roofRef?: (el: SVGPolygonElement | null) => void }) => (
  <g className="as-rise" style={{ ["--i" as string]: key(p.b) }}>
    <g className="as-lift">
      <Block b={p.b} u={U} face={p.face} grain={G} />
      {p.roof && <polygon ref={roofRef} className="rd-roof" points={topFace(p.b)} fill="#FFD400" stroke="#111214" strokeWidth={0.9} vectorEffect="non-scaling-stroke" />}
    </g>
  </g>
);

/**
 * The positioning figure, in the auth pages' kit: a radar tower over a block city, its Signal
 * beam sweeping round; the roofs it crosses light gold and fade. Layers drift against the cursor,
 * blocks lift under it. With reduced motion the beam holds still.
 */
export function RadarScene({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const beam = useRef<SVGPolygonElement>(null);
  const roofs = useRef(new Map<Part, SVGPolygonElement>());

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let a = -2.2;
    let last = performance.now();
    const draw = (now: number) => {
      a += still ? 0 : ((now - last) / 1000) * 0.45;
      last = now;
      const g = (d: number) => P(TX + REACH * Math.cos(a + d), TX + REACH * Math.sin(a + d), 0, U);
      const [l, r] = [g(-BEAM), g(BEAM)];
      beam.current?.setAttribute("points", `${LAMP.join(",")} ${l.join(",")} ${r.join(",")}`);
      roofs.current.forEach((el, p) => {
        const d = Math.atan2(Math.sin(angleOf(p.b) - a), Math.cos(angleOf(p.b) - a));
        el.toggleAttribute("data-on", Math.abs(d) < BEAM);
      });
      if (!still) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const set = (x: number, y: number) => {
    svg.current?.style.setProperty("--mx", x.toFixed(3));
    svg.current?.style.setProperty("--my", y.toFixed(3));
  };
  const ref = (p: Part) => (el: SVGPolygonElement | null) => void (el ? roofs.current.set(p, el) : roofs.current.delete(p));

  return (
    <svg
      ref={svg}
      viewBox={`${minX} ${minY} ${VW} ${VH}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        set((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => set(0, 0)}
    >
      <defs>
        <GrainDefs id={G} />
        <linearGradient id={`${G}-beam`} gradientUnits="userSpaceOnUse" x1={LAMP[0]} y1={LAMP[1]} x2={LAMP[0]} y2={LAMP[1] + 22 * U}>
          <stop offset="0" stopColor="#FFD400" stopOpacity={0.75} />
          <stop offset="1" stopColor="#FFD400" stopOpacity={0.05} />
        </linearGradient>
        <style>{`.rd-roof{opacity:0;transition:opacity 900ms ease-out}.rd-roof[data-on]{opacity:1;transition-duration:150ms}`}</style>
      </defs>
      <g className="as-par" style={{ ["--d" as string]: 22 }}>
        <g className="as-cloud">
          {CLOUDS.map((b, k) => (
            <Block key={k} b={b} u={U} grain={G} />
          ))}
        </g>
      </g>
      <g className="as-par" style={{ ["--d" as string]: 6 }}>
        {behind.map((p, k) => (
          <Piece key={k} p={p} roofRef={p.roof && ref(p)} />
        ))}
        <g className="as-door">
          {TOWER.map((p, k) => (
            <Block key={k} b={p.b} u={U} face={p.face} grain={G} />
          ))}
        </g>
        {front.map((p, k) => (
          <Piece key={k} p={p} roofRef={p.roof && ref(p)} />
        ))}
        <polygon ref={beam} fill={`url(#${G}-beam)`} style={{ mixBlendMode: "multiply" }} className="as-light" />
      </g>
    </svg>
  );
}
