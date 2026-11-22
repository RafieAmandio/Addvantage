"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
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
const SHUT = box(DX + T, DY + 0.12, 0, DW - 2 * T, 0.3, DH - 0.05); // closed, in the frame's plane
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

/**
 * The door, lit or shut: its glow under everything in front, the frame, and the leaf, open or
 * closed. Clicking it swings it; hovering brightens the light.
 */
function Door({ open, onToggle, children }: { open: boolean; onToggle?: () => void; children?: React.ReactNode }) {
  return (
    <>
      <g className="as-lit" data-on={open || undefined}>
        <g className="as-glow">
          <polygon points={OPENING} fill="#FFD400" filter={`url(#${G}-glow)`} />
          <polygon points={OPENING} fill="#FFD400" filter={`url(#${G}-glow)`} />
          <polygon points={SPILL} fill="#FFD400" filter={`url(#${G}-glow)`} opacity={0.55} />
        </g>
        <g className="as-light">
          <polygon points={SPILL} fill="#FFE45C" opacity={0.5} />
          <polygon points={OPENING} fill="#FFF3B0" />
        </g>
      </g>
      <g className={cn("as-door", onToggle && "as-doorhit")} onClick={onToggle}>
        {FRAME.map((b, k) => (
          <Block key={k} b={b} u={U} face="ink" />
        ))}
        <g className="as-leaf">
          <g className="as-swing" data-on={open || undefined}>
            <Block b={LEAF} u={U} face="signal" grain={G} />
          </g>
          <g className="as-swing" data-on={!open || undefined}>
            <Block b={SHUT} u={U} face="white" grain={G} />
          </g>
        </g>
      </g>
      {children}
    </>
  );
}

const Defs = () => (
  <defs>
    <GrainDefs id={G} />
    <filter id={`${G}-glow`} x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation={30} />
    </filter>
  </defs>
);

const Piece = ({ p }: { p: Part }) => (
  <g className="as-rise" style={{ ["--i" as string]: key(p.b) }}>
    <g className="as-lift">
      <Block b={p.b} u={U} face={p.face} grain={G} />
    </g>
  </g>
);

/** Pointer position over the figure as --mx / --my in -0.5..0.5, for the parallax layers. No re-render. */
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

/**
 * The auth illustration: a tall door frame standing open among stacked blocks, the leaf swung out
 * in Signal and the doorway glowing, block trees behind, cloud slabs above. Drawn in code with the
 * landing's iso kit. It builds in from the back; then it is a toy: the layers drift against the
 * cursor, blocks lift under it, the door swings shut and open on a click.
 */
export function AccessScene({ className }: { className?: string }) {
  const [open, setOpen] = useState(true);
  const par = useParallax();
  return (
    <svg {...par} viewBox={`${minX} ${minY} ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <Defs />
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
        <Door open={open} onToggle={() => setOpen((o) => !o)} />
      </g>
      <g className="as-par" style={{ ["--d" as string]: 0 }}>
        {front.map((p, k) => (
          <Piece key={k} p={p} />
        ))}
      </g>
    </svg>
  );
}

// The compact mark: the door on a small plate of blocks, framed tight, for the centred pages.
const PLATE = box(DX - 2.4, DY - 1.2, -0.3, DW + 4.8, 7, 0.3);
const SIDE: Part[] = [
  { b: box(DX - 2.2, DY - 1, 0, 1.6, 1.6, 1.6), face: "white" },
  { b: box(DX - 2.2, DY - 1, 1.6, 0.9, 0.9, 0.9), face: "graphite" },
  { b: box(DX + DW + 0.6, DY - 1, 0, 1.6, 1.6, 2.4), face: "white" },
  { b: box(DX + DW + 0.6, DY + 1.2, 0, 1.2, 1.2, 1.2), face: "graphite" },
  { b: box(DX - 2, DY + 3.4, 0, 1.1, 1.1, 1.1), face: "white" },
];
const mark = [PLATE, ...FRAME, ...SIDE.map((p) => p.b)].flatMap(([x0, x1, y0, y1, z0, z1]) => [P(x0, y1, z0, U), P(x1, y0, z0, U), P(x1, y1, z0, U), P(x0, y0, z1, U)]);
const MX = Math.min(...mark.map((p) => p[0])) - 60;
const MY = Math.min(...mark.map((p) => p[1])) - 60;
const MW = Math.max(...mark.map((p) => p[0])) + 60 - MX;
const MH = Math.max(...mark.map((p) => p[1])) + 40 - MY;

/** The door alone on a plate, glowing, for the early access page. Same toy: hover lifts, click swings. */
export function DoorMark({ className }: { className?: string }) {
  const [open, setOpen] = useState(true);
  const par = useParallax();
  const back = SIDE.filter((p) => p.b[2] < DY);
  const fore = SIDE.filter((p) => p.b[2] >= DY);
  return (
    <svg {...par} viewBox={`${MX} ${MY} ${MW} ${MH}`} className={className} aria-hidden>
      <Defs />
      <g className="as-rise" style={{ ["--i" as string]: 0 }}>
        <Block b={PLATE} u={U} face="white" grain={G} />
      </g>
      <g className="as-par" style={{ ["--d" as string]: 6 }}>
        {back.map((p, k) => (
          <Piece key={k} p={p} />
        ))}
      </g>
      <g className="as-par" style={{ ["--d" as string]: 3 }}>
        <Door open={open} onToggle={() => setOpen((o) => !o)} />
      </g>
      <g className="as-par" style={{ ["--d" as string]: 0 }}>
        {fore.map((p, k) => (
          <Piece key={k} p={p} />
        ))}
      </g>
    </svg>
  );
}

// The application's figure: four treads climbing to a landing, the door standing on it. The tread
// for the current step is lit Signal; the door stays shut until the application is in, then opens
// and glows.
const RISE = 0.9;
const TREAD = 1.5;
const LAND = 4 * RISE;
const LANDING = box(DX - 1.6, DY - 2.4, 0, DW + 3.2, 2.4 + T + 0.6, LAND);
const TREADS = [0, 1, 2, 3].map((k) => box(DX + T, DY + T + 0.6 + (3 - k) * TREAD, 0, DW - 2 * T, TREAD, (k + 1) * RISE));
const STAIR_SIDE: Part[] = ([
  { b: box(DX - 4.4, DY - 3, 0, 2.2, 2.2, 2.2), face: "white" },
  { b: box(DX - 4.4, DY - 3, 2.2, 1.1, 1.1, 1.1), face: "graphite" },
  { b: box(DX - 4.6, DY + 0.4, 0, 1.6, 1.6, 1.6), face: "white" },
  { b: box(DX - 3.2, DY + 4.6, 0, 1.2, 1.2, 1.2), face: "graphite" },
  { b: box(DX + DW + 2, DY - 2.6, 0, 2.2, 2.2, 3.3), face: "white" },
  { b: box(DX + DW + 2.4, DY + 1.2, 0, 1.6, 1.6, 1.6), face: "white" },
  { b: box(DX + DW + 2.6, DY + 1.6, 1.6, 0.9, 0.9, 0.9), face: "graphite" },
  { b: box(DX + DW + 1.4, DY + 5.2, 0, 1.2, 1.2, 1.2), face: "white" },
] satisfies Part[]).sort((a, b) => key(a.b) - key(b.b));
const STAIR_CLOUDS: B[] = [box(DX - 7, DY - 4, LAND + DH + 1, 3.6, 2.2, 0.6), box(DX - 6.2, DY - 3.6, LAND + DH + 1.6, 1.8, 1.2, 0.5), box(DX + DW + 2, DY - 6, LAND + DH + 2.4, 4, 2.4, 0.6)];
const st = [LANDING, ...TREADS, ...STAIR_SIDE.map((p) => p.b), ...STAIR_CLOUDS].flatMap(([x0, x1, y0, y1, z0, z1]) => [P(x0, y1, z0, U), P(x1, y0, z0, U), P(x1, y1, z0, U), P(x0, y0, z1, U)]);
const SX = Math.min(...st.map((p) => p[0])) - 40;
const SY = Math.min(...st.map((p) => p[1])) - 40;
const SW = Math.max(...st.map((p) => p[0])) + 40 - SX;
const SH = Math.max(...st.map((p) => p[1])) + 30 - SY;

/** Steps to the door for the application wizard: `step` lights its tread, `done` opens the door. */
export function StairScene({ step, done, className }: { step: number; done: boolean; className?: string }) {
  const par = useParallax();
  const back = STAIR_SIDE.filter((p) => p.b[2] < DY + T);
  const fore = STAIR_SIDE.filter((p) => p.b[2] >= DY + T);
  return (
    <svg {...par} viewBox={`${SX} ${SY} ${SW} ${SH}`} preserveAspectRatio="xMidYMid meet" className={className} aria-hidden>
      <Defs />
      <g className="as-par" style={{ ["--d" as string]: 20 }}>
        <g className="as-cloud">
          {STAIR_CLOUDS.map((b, k) => (
            <Block key={k} b={b} u={U} grain={G} />
          ))}
        </g>
      </g>
      <g className="as-par" style={{ ["--d" as string]: 8 }}>
        {back.map((p, k) => (
          <Piece key={k} p={p} />
        ))}
      </g>
      <g className="as-par" style={{ ["--d" as string]: 4 }}>
        <g className="as-rise" style={{ ["--i" as string]: 4 }}>
          <Block b={LANDING} u={U} face="white" grain={G} />
        </g>
        <g transform={`translate(0 ${-LAND * U})`}>
          <Door open={done} />
        </g>
        {[3, 2, 1, 0].map((k) => (
          <g key={k} className="as-rise" style={{ ["--i" as string]: 10 + (3 - k) * 3 }}>
            <g className="as-tread" data-on={(!done && k === step) || undefined}>
              <Block b={TREADS[k]!} u={U} face={!done && k === step ? "signal" : "white"} grain={G} />
            </g>
          </g>
        ))}
      </g>
      <g className="as-par" style={{ ["--d" as string]: 0 }}>
        {fore.map((p, k) => (
          <Piece key={k} p={p} />
        ))}
      </g>
    </svg>
  );
}
