"use client";

import { useRef } from "react";
import { P, box, type B } from "@/features/marketing/lib/iso";
import { Block, GrainDefs, type Face } from "@/features/marketing/components/iso/Iso";
import "@/features/auth/components/access-scene.css";

const U = 30;
const G = "tvg-gate";

// The auth door's world, turned into a filter: a lane runs through a tall ink gate among stacked
// blocks. Behind it the queue waits, struck; one Signal block has come through, in the light.
const CELL = 2;
const NX = 9;
const NY = 12;
const DX = 7; // gate's left edge
const DY = 9; // the gate stands in the plane y = DY
const DW = 4.4;
const DH = 8;
const T = 0.55;

const rnd = (x: number, y: number) => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const onLane = (cx: number) => cx * CELL + CELL > DX && cx * CELL < DX + DW;
const LANE0 = Math.floor(DX / CELL);
const LANE1 = Math.ceil((DX + DW) / CELL) - 1;
// Stacks rise with their distance from the lane, so the lane reads as an open avenue.
function cells(cx: number, cy: number) {
  if (onLane(cx)) return 0;
  const d = cx < LANE0 ? LANE0 - cx : cx - LANE1;
  const h = Math.max(0, Math.min(3, Math.round(d * 0.75 + rnd(cx, cy) * 1.2 - 0.9)));
  // The near side (larger x) would hide the lane: one level at most, none right beside it.
  return cx > LANE1 ? (d <= 1 ? 0 : Math.min(1, h)) : h;
}

type Part = { b: B; face: Face; strike?: true };
const parts: Part[] = [];
for (let cx = 0; cx < NX; cx++)
  for (let cy = 0; cy < NY; cy++) {
    const h = cells(cx, cy);
    for (let z = 0; z < h; z++) parts.push({ b: box(cx * CELL, cy * CELL, z * CELL, CELL, CELL, CELL), face: rnd(cx * 7 + z, cy * 3 + z) < 0.1 ? "graphite" : "white" });
    if (h > 0 && rnd(cx + 11, cy + 5) < 0.4) {
      const ox = rnd(cx, cy + 9) < 0.5 ? 0 : 1;
      parts.push({ b: box(cx * CELL + ox, cy * CELL, h * CELL, 1, 1, 1), face: rnd(cx + 3, cy + 1) < 0.3 ? "graphite" : "white" });
    }
  }
// Trees behind the back edges, as on the auth pages.
const tree = (x: number, y: number, i: number, ground: number) => {
  const c = 1.5 + rnd(i, 3) * 0.7;
  const trunk = ground + 0.6 + rnd(i, 9) * 1.1;
  parts.push({ b: box(x + c / 2 - 0.15, y + c / 2 - 0.15, 0, 0.3, 0.3, trunk), face: "ink" });
  parts.push({ b: box(x, y, trunk, c, c, c * 0.8), face: "graphite" });
  parts.push({ b: box(x + c * 0.22, y + c * 0.22, trunk + c * 0.8, c * 0.56, c * 0.56, c * 0.45), face: "graphite" });
};
for (let i = 0; i < 7; i++) tree(-1 + i * 2.6 + rnd(i, 4) * 0.6, -2.6 - (i % 2) * 1.4, i, i > 2 && i < 5 ? 0 : 3);
for (let i = 0; i < 5; i++) tree(-2.8 - (i % 2) * 1.4, 1 + i * 2.8 + rnd(i, 6) * 0.6, i + 20, 2.4);
// The queue on the lane behind the gate, struck; the one that passed, in front, in Signal.
const LX = DX + DW / 2;
[2.4, 5, 7.6].forEach((d, i) => {
  const s = 1.7 + rnd(i, 2) * 0.4;
  parts.push({ b: box(LX - s / 2, DY - d - s / 2, 0, s, s, s * (0.8 + rnd(i, 8) * 0.5)), face: "white", strike: true });
});
const PASSED = box(LX - 1.1, DY + T + 1.6, 0, 2.2, 2.2, 2.2);
const key = (b: B) => b[0] + b[2] + b[4];
parts.sort((a, b) => key(a.b) - key(b.b));
const behind = parts.filter((p) => p.b[2] < DY);
const front = parts.filter((p) => p.b[2] >= DY);

const FRAME: B[] = [box(DX, DY, 0, T, T, DH), box(DX + DW - T, DY, 0, T, T, DH), box(DX - 0.3, DY, DH, DW + 0.6, T, T + 0.1)];
const poly = (ps: [number, number, number][]) => ps.map(([x, y, z]) => P(x, y, z, U).map((n) => n.toFixed(1)).join(",")).join(" ");
const yf = DY + T;
const SPILL = poly([[DX + T, yf, 0], [DX + DW - T, yf, 0], [DX + DW + 1.4, yf + 6.5, 0], [DX + T + 1.6, yf + 6.5, 0]]);
const CLOUDS: B[] = [box(-1, 1, 13, 4, 2.4, 0.7), box(0, 1.5, 13.7, 2, 1.4, 0.6), box(15, -3, 15, 4.6, 2.6, 0.7), box(16, -2.4, 15.7, 2.2, 1.4, 0.6)];

// Framed on the gate, a little low, so the queue behind it shows.
const [gcx] = P(LX, DY, 0, U);
const [, gTop] = P(DX, DY, DH, U);
const VH = DH * U * 3.8;
const VW = VH * 0.85;
const minX = gcx - VW / 2;
const minY = gTop - VH * 0.28;

const strike = (b: B) => {
  const [a, c] = [P(b[0] + 0.2, b[3] - 0.2, b[5], U), P(b[1] - 0.2, b[2] + 0.2, b[5], U)];
  return <path d={`M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${c[0].toFixed(1)} ${c[1].toFixed(1)}`} stroke="#111214" strokeWidth={2.4} strokeLinecap="square" />;
};
const Piece = ({ p }: { p: Part }) => (
  <g className="as-rise" style={{ ["--i" as string]: key(p.b) }}>
    <g className="as-lift">
      <Block b={p.b} u={U} face={p.face} grain={G} />
      {p.strike && strike(p.b)}
    </g>
  </g>
);

/**
 * The positioning figure, in the auth pages' kit: a lane through a tall ink gate among stacked
 * blocks, the queue struck behind it, one Signal block through it and lit. Layers drift against
 * the cursor; blocks lift under it.
 */
export function GateScene({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const set = (x: number, y: number) => {
    ref.current?.style.setProperty("--mx", x.toFixed(3));
    ref.current?.style.setProperty("--my", y.toFixed(3));
  };
  return (
    <svg
      ref={ref}
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
        <filter id={`${G}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={30} />
        </filter>
      </defs>
      <g className="as-par" style={{ ["--d" as string]: 22 }}>
        <g className="as-cloud">
          {CLOUDS.map((b, k) => (
            <Block key={k} b={b} u={U} grain={G} />
          ))}
        </g>
      </g>
      <g className="as-par" style={{ ["--d" as string]: 8 }}>
        {behind.map((p, k) => (
          <Piece key={k} p={p} />
        ))}
      </g>
      <g className="as-par" style={{ ["--d" as string]: 4 }}>
        <g className="as-glow">
          <polygon points={SPILL} fill="#FFD400" filter={`url(#${G}-glow)`} opacity={0.6} />
        </g>
        <g className="as-light">
          <polygon points={SPILL} fill="#FFE45C" opacity={0.45} />
        </g>
        <g className="as-door">
          {FRAME.map((b, k) => (
            <Block key={k} b={b} u={U} face="ink" />
          ))}
        </g>
      </g>
      <g className="as-par" style={{ ["--d" as string]: 0 }}>
        {front.map((p, k) => (
          <Piece key={k} p={p} />
        ))}
        <g className="as-rise" style={{ ["--i" as string]: 40 }}>
          <g className="as-lift">
            <Block b={PASSED} u={U} face="signal" grain={G} />
          </g>
        </g>
      </g>
    </svg>
  );
}
