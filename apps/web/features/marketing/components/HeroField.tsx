"use client";

import { box, P, type B } from "@/features/marketing/lib/iso";
import { Block, GrainDefs, type Face } from "./iso/Iso";
import "./hero-field.css";

const INK = "#111214";
const rnd = (x: number, y: number) => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const at = (u: number) => (x: number, y: number, z: number) => P(x, y, z, u).map((n) => +n.toFixed(1)) as [number, number];
const ring = (ps: [number, number][]) => ps.map((p) => p.join(",")).join(" ");

/**
 * The landing hero's illustration: a field of cube stacks filling the first screen, low under the
 * headline and climbing toward both edges, a few Signal tops, loose cubes in the air. It rises in
 * from the centre out, the loose cubes float, a stack lifts under the pointer.
 */

const DU = 24;
const DC = 2; // cube size, world units
const SPAN = 30; // half width of the field, in grid steps along the screen
const ROWS: [number, number] = [6, 22]; // depth band (gx + gy) of the field
type Stack = { b: B; h: number; top: Face | null; key: number; edge: number };
const STACKS: Stack[] = [];
for (let gx = -SPAN; gx <= SPAN + ROWS[1]; gx++)
  for (let gy = -SPAN; gy <= SPAN + ROWS[1]; gy++) {
    const sx = gx - gy;
    const dd = gx + gy;
    if (Math.abs(sx) > SPAN || dd < ROWS[0] || dd > ROWS[1]) continue;
    const edge = Math.abs(sx) / SPAN; // 0 under the headline, 1 at the screen edge
    const front = (dd - ROWS[0]) / (ROWS[1] - ROWS[0]); // 0 back row, 1 front row
    const n = rnd(gx, gy);
    // A valley: one cube under the copy, stacks climbing toward both edges, the back rows taller.
    let h = Math.round(1 + edge ** 2.2 * 9 * (1.15 - front * 0.6) + n * 1.6 - front * 1.2);
    if (edge < 0.3) h = n < 0.4 ? 1 : 0;
    if (h < 1) h = n < 0.5 ? 1 : 0;
    if (!h) continue;
    const top: Face | null = n > 0.975 ? "signal" : n < 0.05 && h > 1 ? "graphite" : null;
    STACKS.push({ b: box(gx * DC, gy * DC, 0, DC, DC, (h - (top ? 1 : 0)) * DC), h, top, key: dd * 100 + sx, edge });
  }
STACKS.sort((a, b) => a.key - b.key);
// Loose cubes in the air over both sides, a few of them Signal.
const FLOAT = Array.from({ length: 12 }, (_, i) => {
  const side = i % 2 ? 1 : -1;
  const sx = side * (19 + rnd(i, 1) * 10);
  const dd = 4 + rnd(i, 2) * 8;
  const gx = (sx + dd) / 2;
  const gy = (dd - sx) / 2;
  const sz = 0.8 + rnd(i, 3) * 0.9;
  return { b: box(gx * DC, gy * DC, 14 + rnd(i, 4) * 12, sz, sz, sz), face: (rnd(i, 5) < 0.25 ? "signal" : rnd(i, 6) < 0.4 ? "graphite" : "white") as Face, i };
});

/** Horizontal seams across a column's two visible sides, so one tall block reads as stacked cubes. */
function Seams({ b }: { b: B }) {
  const dp = at(DU);
  const [x0, x1, y0, y1, z0, z1] = b;
  const lines = [];
  for (let z = z0 + DC; z < z1 - 0.01; z += DC) lines.push(ring([dp(x0, y1, z), dp(x1, y1, z), dp(x1, y0, z)]));
  return (
    <>
      {lines.map((l, k) => (
        <polyline key={k} points={l} fill="none" stroke={INK} strokeWidth={0.9} vectorEffect="non-scaling-stroke" />
      ))}
    </>
  );
}

export function CubeField({ className }: { className?: string }) {
  const dp = at(DU);
  // The frame: the field's full width, from high over the tallest edge stacks down to its front row.
  const [left] = dp(0, SPAN * DC, 0);
  const [right] = dp(SPAN * DC, 0, 0);
  const [, bottom] = dp((ROWS[1] / 2) * DC + DC, (ROWS[1] / 2) * DC + DC, 0);
  const top = bottom - (right - left) * 0.62;
  return (
    <svg viewBox={`${left} ${top} ${right - left} ${bottom - top}`} preserveAspectRatio="xMidYMax slice" className={className} aria-hidden>
      <defs>
        <GrainDefs id="hvd" />
      </defs>
      {STACKS.map((st, k) => (
        <g key={k} className="hv-stack" style={{ ["--i" as string]: Math.round((1 - st.edge) * 12) }}>
          <g className="hv-lift">
            <Block b={st.b} u={DU} face="white" grain="hvd" />
            <Seams b={st.b} />
            {st.top && <Block b={box(st.b[0], st.b[2], st.b[5], DC, DC, DC)} u={DU} face={st.top} grain="hvd" />}
          </g>
        </g>
      ))}
      {FLOAT.map((c) => (
        <g key={`f${c.i}`} className="hv-float" style={{ ["--j" as string]: c.i }}>
          <Block b={c.b} u={DU} face={c.face} grain="hvd" />
        </g>
      ))}
    </svg>
  );
}
