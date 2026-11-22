import { P, box, type B } from "@/features/marketing/lib/iso";
import { Block, GrainDefs, type Face } from "@/features/marketing/components/iso/Iso";
import "./access-scene.css";

const U = 30;
const G = "tvg-access";

// A big door frame standing open among stacked blocks, its leaf swung out in Signal, a dark
// tree line behind the blocks, cloud slabs above. Blocks sit on a 2-unit grid with a few
// small cubes on top, so the sizes vary.
const CELL = 2;
const NX = 9;
const NY = 7;
const DX = 7; // door frame's left edge
const DY = 6; // the frame stands in the plane y = DY
const DW = 4.4;
const DH = 10.5;
const T = 0.55;

const rnd = (x: number, y: number) => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const onPath = (cx: number, cy: number) => cy * CELL >= DY && cx * CELL + CELL > DX && cx * CELL < DX + DW;
function cells(cx: number, cy: number) {
  if (onPath(cx, cy)) return 0;
  const back = Math.max(0, DY / CELL - cy) * 0.35;
  const side = Math.abs(cx + 0.5 - (DX + DW / 2) / CELL) * 0.3;
  return Math.max(0, Math.min(3, Math.round(back + side + rnd(cx, cy) * 1.3 - 0.7)));
}

type Part = { b: B; face: Face };
const parts: Part[] = [];
for (let cx = 0; cx < NX; cx++)
  for (let cy = 0; cy < NY; cy++) {
    const h = cells(cx, cy);
    for (let z = 0; z < h; z++) parts.push({ b: box(cx * CELL, cy * CELL, z * CELL, CELL, CELL, CELL), face: rnd(cx * 7 + z, cy * 3 + z) < 0.1 ? "graphite" : "white" });
    // A small cube on some stacks, set into the back half so it never hangs over an edge.
    if (h > 0 && rnd(cx + 11, cy + 5) < 0.4) {
      const ox = rnd(cx, cy + 9) < 0.5 ? 0 : 1;
      parts.push({ b: box(cx * CELL + ox, cy * CELL, h * CELL, 1, 1, 1), face: rnd(cx + 3, cy + 1) < 0.3 ? "graphite" : "white" });
    }
  }
const key = (b: B) => b[0] + b[2] + b[4];
parts.sort((a, b) => key(a.b) - key(b.b));
const behind = parts.filter((p) => p.b[2] < DY);
const front = parts.filter((p) => p.b[2] >= DY);

const FRAME: B[] = [box(DX, DY, 0, T, T, DH), box(DX + DW - T, DY, 0, T, T, DH), box(DX, DY, DH, DW, T, T)];
const LEAF = box(DX + T, DY + T, 0, 0.22, DW - 2 * T - 0.25, DH - 0.08); // swung open toward the viewer
const CLOUDS: B[] = [box(-1, 1, 11.2, 4, 2.4, 0.7), box(0, 1.5, 11.9, 2, 1.4, 0.6), box(14, -3, 14, 4.6, 2.6, 0.7), box(15, -2.4, 14.7, 2.2, 1.4, 0.6)];

// The tree line: overlapping round crowns along the back of the blocks, in screen space.
const TREES = Array.from({ length: 30 }, (_, i) => {
  const x = -3 + i * 0.75;
  const back = i % 2 ? -1.2 : -2.4; // two staggered rows make a mass, not a chain
  const [sx, sy] = P(x, back, 1.6 + rnd(i, 2) * 2.2, U);
  return { cx: sx, cy: sy, r: U * (1.2 + rnd(i, 7) * 0.7) };
}).sort((a, b) => a.cy - b.cy);

// Framed on the door: it stands about three quarters of the view's height, sky above it.
const [dcx] = P(DX + DW / 2, DY, 0, U);
const [, dTop] = P(DX, DY, DH, U);
const VH = DH * U * 2.2;
const VW = VH * 1.3;
const minX = dcx - VW / 2;
const minY = dTop - VH * 0.24;

const Piece = ({ p, i }: { p: Part; i: number }) => (
  <g className="as-rise" style={{ ["--i" as string]: i }}>
    <Block b={p.b} u={U} face={p.face} grain={G} />
  </g>
);

/**
 * The auth illustration: a tall door frame standing open among stacked blocks, the leaf swung out
 * in Signal, a tree line behind, cloud slabs above. Drawn in code with the landing's iso kit; the
 * trees and blocks rise in from the back, then the door, then the leaf. Reduced motion shows it built.
 */
export function AccessScene({ className }: { className?: string }) {
  return (
    <svg viewBox={`${minX} ${minY} ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <GrainDefs id={G} />
      </defs>
      <g className="as-cloud">
        {CLOUDS.map((b, k) => (
          <Block key={k} b={b} u={U} grain={G} />
        ))}
      </g>
      <g className="as-trees">
        {TREES.map((t, k) => (
          <g key={k}>
            <circle cx={t.cx} cy={t.cy} r={t.r} fill="#3A3C40" />
            <circle cx={t.cx} cy={t.cy} r={t.r} fill={`url(#${G}-h)`} opacity={0.7} />
            <circle cx={t.cx} cy={t.cy} r={t.r} fill="none" stroke="#111214" strokeWidth={0.9} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      </g>
      {behind.map((p, k) => (
        <Piece key={k} p={p} i={key(p.b)} />
      ))}
      <g className="as-door">
        {FRAME.map((b, k) => (
          <Block key={k} b={b} u={U} face="ink" />
        ))}
      </g>
      <g className="as-leaf">
        <Block b={LEAF} u={U} face="signal" grain={G} />
      </g>
      {front.map((p, k) => (
        <Piece key={k} p={p} i={key(p.b)} />
      ))}
    </svg>
  );
}
