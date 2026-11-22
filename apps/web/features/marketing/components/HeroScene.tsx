"use client";

import { useRef, useState } from "react";
import type { HeroData } from "@/features/marketing/lib/landing";
import { C, P, S, box, type B } from "@/features/marketing/lib/iso";
import { Block, GrainDefs, type Face } from "./iso/Iso";
import "@/features/auth/components/access-scene.css";
import "./hero-scene.css";

const U = 26;
const G = "tvg-hscene";
const CELL = 2;

// The hero poster, in world units: a block city that fills the frame, a clear plaza in the middle
// where the real candles of the hero's level test stand as a 3D chart, the key level cut through
// them as a lit Signal plane, a radar tower beside them sweeping the ground, and the noise, a
// swarm of loose cubes, hanging in the sky behind.
// Candles march left to right on screen: each one a step along +x -y.
const X0 = 14.5;
const Y0 = 28.6;
const STEP = 1.75;
const CW = 1.35;
const WK = 0.24;
const TOWER = { x: 25, y: 5.5, h: 11.5 };

const rnd = (x: number, y: number) => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

type Part = { b: B; face: Face };
const key = (b: B) => b[0] + b[2] + b[4];

// The plate: one diamond the scene stands on, cube stacks along its two back edges and a few
// low cubes on the front ones, so the chart in the middle is never hidden.
const PX0 = 2;
const PX1 = 32;
const PLATE = box(PX0, PX0, -0.5, PX1 - PX0, PX1 - PX0, 0.5);
const city: Part[] = [];
for (let x = PX0; x < PX1; x += CELL)
  for (let y = PX0; y < PX1; y += CELL) {
    const back = x === PX0 || y === PX0;
    const front = x === PX1 - CELL || y === PX1 - CELL;
    if (!back && !front) continue;
    const cx = x / CELL;
    const cy = y / CELL;
    const h = back ? Math.max(1, Math.min(2, Math.round(0.6 + rnd(cx, cy) * 1.6))) : rnd(cx, cy) < 0.35 ? 1 : 0;
    const s = front ? 1 : CELL;
    for (let z = 0; z < h; z++) city.push({ b: box(x, y, z * s, s, s, s), face: rnd(cx * 7 + z, cy * 3 + z) < 0.2 ? "graphite" : "white" });
    if (h > 0 && back && rnd(cx + 11, cy + 5) < 0.4) city.push({ b: box(x + (rnd(cx, cy + 9) < 0.5 ? 0 : 1), y, h * CELL, 1, 1, 1), face: rnd(cx + 3, cy + 1) < 0.3 ? "graphite" : "white" });
  }
city.sort((a, b) => key(a.b) - key(b.b));
const backCity = city.filter((p) => p.b[0] === PX0 || p.b[2] === PX0 || p.b[5] > 1.01);
const frontCity = city.filter((p) => !backCity.includes(p));

// The noise: loose small cubes over the back of the city, left of the chart.
const NOISE = Array.from({ length: 34 }, (_, i) => {
  const s = 0.35 + rnd(i, 1) * 0.45;
  return { b: box(2 + rnd(i, 2) * 9, 12 + rnd(i, 3) * 10, 12 + rnd(i, 4) * 8, s, s, s), face: (rnd(i, 5) < 0.4 ? "graphite" : "white") as Face, i };
});

// The radar tower: four ink legs, two rings of braces, a platform, the Signal dish on a mast.
const { x: TX, y: TY, h: TH } = TOWER;
const LEG = 0.28;
const TOWER_PARTS: Part[] = [
  ...[[0, 0], [2.2, 0], [0, 2.2], [2.2, 2.2]].map(([dx, dy]) => ({ b: box(TX + dx!, TY + dy!, 0, LEG, LEG, TH), face: "ink" as Face })),
  ...[3.6, 7.6].flatMap((z) => [box(TX, TY, z, 2.48, LEG, 0.22), box(TX, TY + 2.2, z, 2.48, LEG, 0.22), box(TX, TY, z, LEG, 2.48, 0.22), box(TX + 2.2, TY, z, LEG, 2.48, 0.22)].map((b) => ({ b, face: "ink" as Face }))),
  { b: box(TX - 0.5, TY - 0.5, TH, 3.5, 3.5, 0.45), face: "white" },
  { b: box(TX + 1.05, TY + 1.05, TH + 0.45, 0.4, 0.4, 1.6), face: "ink" },
];

/** World point to a fixed-precision screen point. */
const pt = (x: number, y: number, z: number) => P(x, y, z, U).map((n) => +n.toFixed(1)) as [number, number];
const poly = (ps: [number, number, number][]) => ps.map(([x, y, z]) => pt(x, y, z).join(",")).join(" ");

/** Pointer position over the figure as --mx / --my in -0.5..0.5, for the parallax layers. */
function useParallax() {
  const ref = useRef<SVGSVGElement>(null);
  const set = (x: number, y: number) => {
    ref.current?.style.setProperty("--mx", x.toFixed(3));
    ref.current?.style.setProperty("--my", y.toFixed(3));
  };
  return {
    ref,
    onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.pointerType !== "mouse") return;
      const r = e.currentTarget.getBoundingClientRect();
      set((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
    },
    onPointerLeave: () => set(0, 0),
  };
}

const Piece = ({ p, i = key(p.b) }: { p: Part; i?: number }) => (
  <g className="as-rise" style={{ ["--i" as string]: i }}>
    <g className="as-lift">
      <Block b={p.b} u={U} face={p.face} grain={G} />
    </g>
  </g>
);

/** Split a block at a z plane: the part under it and the part over it (either may be empty). */
const split = (b: B, z: number): [B | null, B | null] => [
  b[4] < z ? [b[0], b[1], b[2], b[3], b[4], Math.min(b[5], z)] : null,
  b[5] > z ? [b[0], b[1], b[2], b[3], Math.max(b[4], z), b[5]] : null,
];

/**
 * The landing hero's illustration. Real data: the candles are the hero's level test, the lit plane
 * is the level the app drew, the label prints its exact price. It builds in, then plays: layers
 * drift against the cursor, city blocks lift under it, a candle shows its OHLC when hovered or
 * tapped, the radar keeps sweeping, the noise keeps flickering.
 */
export function HeroScene({ d, className }: { d: HeroData; className?: string }) {
  const par = useParallax();
  const [hot, setHot] = useState<number | null>(null);

  const lows = d.bars.map((b) => b[3]);
  const highs = d.bars.map((b) => b[2]);
  const lo = Math.min(...lows, d.level);
  const hi = Math.max(...highs, d.level);
  const zOf = (p: number) => 1.4 + ((p - lo) / (hi - lo || 1)) * 13;
  const zL = zOf(d.level);

  const candles = d.bars.map(([, o, h, l, c], i) => {
    const x = X0 + i * STEP;
    const y = Y0 - i * STEP;
    const zb0 = zOf(Math.min(o, c));
    const zb1 = Math.max(zOf(Math.max(o, c)), zb0 + 0.18);
    return {
      i,
      x,
      y,
      body: box(x, y, zb0, CW, CW, zb1 - zb0),
      wick: box(x + CW / 2 - WK / 2, y + CW / 2 - WK / 2, zOf(l), WK, WK, zOf(h) - zOf(l)),
      face: (c >= o ? "white" : "graphite") as Face,
    };
  });
  // The level: a thin lit strip under the candles' line, past both ends, a little deeper than them.
  const n = candles.length;
  const c0x = X0 + CW / 2;
  const c0y = Y0 + CW / 2;
  const t0 = -1.8;
  const t1 = (n - 1) * STEP + 2.2;
  const w = 1.5;
  const at = (t: number, q: number): [number, number, number] => [c0x + t + q, c0y - t + q, zL];
  const down = ([x, y, z]: [number, number, number]): [number, number, number] => [x, y, z - 0.16];
  const PLANE = poly([at(t0, -w), at(t1, -w), at(t1, w), at(t0, w)]);
  const EDGE = poly([at(t0, w), at(t1, w), down(at(t1, w)), down(at(t0, w))]);
  const EDGE_R = poly([at(t1, -w), at(t1, w), down(at(t1, w)), down(at(t1, -w))]);

  // Each candle in two halves around the plane, so the plane sits between them.
  const halves = (half: 0 | 1) =>
    candles.map((k) => {
      const w = split(k.wick, zL)[half];
      const b = split(k.body, zL)[half];
      return (
        <g
          key={k.i}
          className="hs-candle as-rise"
          data-hot={hot === k.i || undefined}
          style={{ ["--i" as string]: 30 + k.i * 3 }}
          onPointerEnter={() => setHot(k.i)}
          onPointerLeave={() => setHot((h) => (h === k.i ? null : h))}
          onClick={() => setHot(k.i)}
        >
          {w && <Block b={w} u={U} face="ink" />}
          {b && <Block b={b} u={U} face={k.face} grain={G} />}
        </g>
      );
    });

  // Leader for the level: from the plane's far right corner, up, then right.
  const [lx, ly] = pt(...at(t0, w));
  const ex = lx - 90;
  const ey = ly + 70;

  // The hovered candle's readout, left of its top.
  const bar = hot === null ? null : d.fmt.bars[hot];
  const [hx, hy] = hot === null ? [0, 0] : pt(candles[hot]!.x, candles[hot]!.y, candles[hot]!.wick[5]);

  // The sweep: a wedge on the ground plane around the tower, drawn in world units.
  const [sx, sy] = pt(TX + 1.24, TY + 1.24, 0);
  const R = 9.5;
  const A = (52 * Math.PI) / 180;

  // Framed on everything: the plate, the noise above it, the tower's dish.
  const all = [PLATE, ...city.map((p) => p.b), ...NOISE.map((n) => n.b), box(TX, TY, 0, 2.5, 2.5, TH + 3)].flatMap(([x0, x1, y0, y1, z0, z1]) => [pt(x0, y1, z0), pt(x1, y0, z0), pt(x1, y1, z0), pt(x0, y0, z1), pt(x1, y0, z1)]);
  const minX = Math.min(...all.map((q) => q[0])) - 30;
  const top = Math.min(...all.map((q) => q[1])) - 20;
  const VW = Math.max(...all.map((q) => q[0])) + 30 - minX;
  // The plate's empty front corner runs off the bottom edge.
  const VH = (Math.max(...all.map((q) => q[1])) - top) * 0.84;

  return (
    <svg {...par} viewBox={`${minX.toFixed(1)} ${top.toFixed(1)} ${VW.toFixed(1)} ${VH.toFixed(1)}`} preserveAspectRatio="xMidYMid meet" className={className} aria-hidden>
      <defs>
        <GrainDefs id={G} />
        <filter id={`${G}-glow`} x="-40%" y="-80%" width="180%" height="260%">
          <feGaussianBlur stdDeviation={18} />
        </filter>
        <radialGradient id={`${G}-sweep`} cx="0" cy="0" r={R} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFD400" stopOpacity={0.7} />
          <stop offset="1" stopColor="#FFD400" stopOpacity={0} />
        </radialGradient>
      </defs>

      <g className="as-par" style={{ ["--d" as string]: 26 }}>
        {NOISE.map((n) => (
          <g key={n.i} className="hs-noise" style={{ ["--i" as string]: n.i }}>
            <Block b={n.b} u={U} face={n.face} grain={G} />
          </g>
        ))}
      </g>

      <g className="as-par" style={{ ["--d" as string]: 10 }}>
        <g className="as-rise" style={{ ["--i" as string]: 0 }}>
          <Block b={PLATE} u={U} face="white" grain={G} />
        </g>
        {backCity.map((p, k) => (
          <Piece key={k} p={p} />
        ))}
      </g>

      <g className="as-par" style={{ ["--d" as string]: 5 }}>
        <g transform={`matrix(${C * U} ${S * U} ${-C * U} ${S * U} ${sx} ${sy})`}>
          <g className="hs-sweep">
            <circle r={R} fill="none" />
            <path d={`M0 0L${R} 0A${R} ${R} 0 0 1 ${(R * Math.cos(A)).toFixed(2)} ${(R * Math.sin(A)).toFixed(2)}Z`} fill={`url(#${G}-sweep)`} />
          </g>
          <circle r={R} fill="none" stroke="#111214" strokeOpacity={0.18} strokeDasharray="0.3 0.5" strokeWidth={0.06} />
          <circle r={R * 0.55} fill="none" stroke="#111214" strokeOpacity={0.14} strokeDasharray="0.3 0.5" strokeWidth={0.06} />
        </g>

        {halves(0)}

        <g className="hs-level">
          <polygon points={PLANE} fill="#FFD400" filter={`url(#${G}-glow)`} className="hs-glow" />
          <polygon points={PLANE} fill="#FFE45C" opacity={0.62} />
          <polygon points={EDGE} fill="#E2BB00" />
          <polygon points={EDGE_R} fill="#C9A600" />
          <polygon points={PLANE} fill="none" stroke="#111214" strokeWidth={0.9} vectorEffect="non-scaling-stroke" />
        </g>

        {halves(1)}

        {TOWER_PARTS.map((p, k) => (
          <Piece key={k} p={p} i={50 + k} />
        ))}
        <g className="as-rise hs-dish" style={{ ["--i" as string]: 64 }}>
          {(() => {
            const [mx, my] = pt(TX + 1.25, TY + 1.25, TH + 2.05);
            return (
              <>
                <ellipse cx={mx} cy={my} rx={34} ry={14} transform={`rotate(-24 ${mx} ${my})`} fill="#FFD400" stroke="#111214" strokeWidth={0.9} />
                <ellipse cx={mx + 3} cy={my - 2} rx={24} ry={8} transform={`rotate(-24 ${mx} ${my})`} fill="#E2BB00" />
                <circle cx={mx} cy={my} r={2.6} fill="#111214" />
              </>
            );
          })()}
        </g>

        <g className="hs-label" fontFamily="var(--font-tv-mono)" fill="#111214">
          <circle cx={lx} cy={ly} r={2.4} />
          <path d={`M${lx} ${ly}V${ey}H${ex}`} fill="none" stroke="#111214" strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
          <text x={ex - 6} y={ey - 2} textAnchor="end" fontSize={17} letterSpacing="0.08em" fontWeight={600}>
            KEY LEVEL
          </text>
          <text x={ex - 6} y={ey + 19} textAnchor="end" fontSize={17} letterSpacing="0.06em" fill="#5D5F64">
            {d.sym} {d.fmt.level}
          </text>
        </g>
      </g>

      <g className="as-par" style={{ ["--d" as string]: 0 }}>
        {frontCity.map((p, k) => (
          <Piece key={k} p={p} />
        ))}
      </g>

      {bar && (
        <g key={hot} className="hs-read" fontFamily="var(--font-tv-mono)" fontSize={15} letterSpacing="0.04em" pointerEvents="none">
          <rect x={hx - 214} y={hy - 104} width={196} height={110} fill="#FFFFFF" stroke="#111214" strokeWidth={0.9} />
          <text x={hx - 200} y={hy - 80} fill="#5D5F64">
            {bar.time}
          </text>
          {(["o", "h", "l", "c"] as const).map((f, k) => (
            <text key={f} x={hx - 200} y={hy - 56 + k * 18} fill="#111214">
              {f.toUpperCase()} {bar[f]}
            </text>
          ))}
        </g>
      )}
    </svg>
  );
}
