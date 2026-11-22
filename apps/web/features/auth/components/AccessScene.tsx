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
// Trees behind the hill, built of blocks like everything else: an ink trunk, a graphite crown,
// a smaller cube on top. Two staggered rows so they read as a wood, not a fence.
const hillTop = (x: number) => {
  const cx = Math.max(0, Math.min(NX - 1, Math.floor(x / CELL)));
  return Math.max(cells(cx, 0), cells(cx, 1)) * CELL;
};
// Along both back edges of the hill: the y-back edge (upper right) and the x-back edge (upper left).
const tree = (x: number, y: number, i: number, ground: number) => {
  const c = 1.5 + rnd(i, 3) * 0.7;
  const trunk = ground + 0.6 + rnd(i, 9) * 1.1;
  parts.push({ b: box(x + c / 2 - 0.15, y + c / 2 - 0.15, 0, 0.3, 0.3, trunk), face: "ink" });
  parts.push({ b: box(x, y, trunk, c, c, c * 0.8), face: "graphite" });
  parts.push({ b: box(x + c * 0.22, y + c * 0.22, trunk + c * 0.8, c * 0.56, c * 0.56, c * 0.45), face: "graphite" });
};
for (let i = 0; i < 6; i++) tree(DX + DW + 1 + i * 2.6 + rnd(i, 4) * 0.6, -2.6 - (i % 2) * 1.4, i, hillTop(DX + DW + 2 + i * 2.6) * 0.7);
for (let i = 0; i < 4; i++) tree(-2.8 - (i % 2) * 1.4, 1 + i * 2.8 + rnd(i, 6) * 0.6, i + 20, 2.4);
const key = (b: B) => b[0] + b[2] + b[4];
parts.sort((a, b) => key(a.b) - key(b.b));
const behind = parts.filter((p) => p.b[2] < DY);
const front = parts.filter((p) => p.b[2] >= DY);

const FRAME: B[] = [box(DX, DY, 0, T, T, DH), box(DX + DW - T, DY, 0, T, T, DH), box(DX, DY, DH, DW, T, T)];
const LEAF = box(DX + T, DY + T, 0, 0.22, DW - 2 * T - 0.25, DH - 0.08); // swung open toward the viewer
const poly = (ps: [number, number, number][]) => ps.map(([x, y, z]) => P(x, y, z, U).map((n) => n.toFixed(1)).join(",")).join(" ");
const yf = DY + T; // the frame's front plane
const OPENING = poly([[DX + T, yf, 0], [DX + DW - T, yf, 0], [DX + DW - T, yf, DH], [DX + T, yf, DH]]);
const SPILL = poly([[DX + T, yf, 0], [DX + DW - T, yf, 0], [DX + DW + 1.6, yf + 6, 0], [DX + T + 1.8, yf + 6, 0]]);
const CLOUDS: B[] = [box(-1, 1, 11.2, 4, 2.4, 0.7), box(0, 1.5, 11.9, 2, 1.4, 0.6), box(14, -3, 14, 4.6, 2.6, 0.7), box(15, -2.4, 14.7, 2.2, 1.4, 0.6)];


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
 * in Signal, block trees behind, cloud slabs above. Drawn in code with the landing's iso kit; the
 * trees and blocks rise in from the back, then the door, then the leaf. Reduced motion shows it built.
 */
export function AccessScene({ className }: { className?: string }) {
  return (
    <svg viewBox={`${minX} ${minY} ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <GrainDefs id={G} />
        <filter id={`${G}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={30} />
        </filter>
      </defs>
      <g className="as-cloud">
        {CLOUDS.map((b, k) => (
          <Block key={k} b={b} u={U} grain={G} />
        ))}
      </g>
      {behind.map((p, k) => (
        <Piece key={k} p={p} i={key(p.b)} />
      ))}
      <g className="as-glow">
        <polygon points={OPENING} fill="#FFD400" filter={`url(#${G}-glow)`} />
        <polygon points={OPENING} fill="#FFD400" filter={`url(#${G}-glow)`} />
        <polygon points={SPILL} fill="#FFD400" filter={`url(#${G}-glow)`} opacity={0.55} />
      </g>
      <g className="as-light">
        <polygon points={SPILL} fill="#FFE45C" opacity={0.5} />
        <polygon points={OPENING} fill="#FFF3B0" />
      </g>
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
      {/* The glow bleeds a little over the blocks in front, as light would. */}
      <g className="as-glow" style={{ mixBlendMode: "multiply" }} opacity={0.35}>
        <polygon points={OPENING} fill="#FFD400" filter={`url(#${G}-glow)`} />
        <polygon points={SPILL} fill="#FFD400" filter={`url(#${G}-glow)`} />
      </g>
    </svg>
  );
}
