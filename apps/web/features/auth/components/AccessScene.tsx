import { P, box, type B } from "@/features/marketing/lib/iso";
import { Block, GrainDefs, Shadow, type Face } from "@/features/marketing/components/iso/Iso";
import "./access-scene.css";

const U = 40;
const G = "tvg-access";

// Three rows of candles standing on the floor like a skyline, closes walking a market's path.
// Heights are bar closes, up bars white, down bars graphite, each with an ink wick on top.
const ROWS: { y: number; h: number[] }[] = [
  { y: -4.4, h: [2.4, 2.8, 2.6, 3.3, 3.0, 3.7, 4.2, 3.8, 3.5, 4.0, 4.6, 4.3, 4.9] },
  { y: -2.2, h: [1.5, 1.9, 1.7, 2.3, 2.6, 2.3, 2.0, 2.5, 3.0, 2.8, 2.4, 2.9, 3.3] },
  { y: 0, h: [0.8, 1.1, 0.9, 1.3, 1.0, 1.5, 1.2, 1.0, 1.2, 1.6, 1.4, 1.8, 1.5] },
];
const STEP = 1.15;
const BAR = 0.8;

type Part = { b: B; face: Face; shadow?: boolean };

const parts: Part[] = [];
for (const r of ROWS) {
  r.h.forEach((h, i) => {
    const x = i * STEP;
    const down = i > 0 && h < r.h[i - 1]! - 0.25;
    parts.push({ b: box(x, r.y, 0, BAR, BAR, h), face: down ? "graphite" : "white", shadow: true });
    parts.push({ b: box(x + BAR / 2 - 0.06, r.y + BAR / 2 - 0.06, h, 0.12, 0.12, 0.35 + ((i * 7) % 5) * 0.12), face: "ink" });
  });
}
// Back to front: on this grid the back corner's x + y orders every block correctly.
parts.sort((a, b) => a.b[0] + a.b[2] - (b.b[0] + b.b[2]) || a.b[4] - b.b[4]);

// The door: a plate in front of the skyline, an ink frame, the leaf swung open toward the viewer in Signal.
const DX = 10.4;
const DY = 2.8;
const DOOR: Part[] = [
  { b: box(DX - 1.4, DY - 0.7, -0.12, 4.2, 3.4, 0.12), face: "white", shadow: true },
  { b: box(DX, DY, 0, 0.2, 0.2, 2.8), face: "ink" },
  { b: box(DX + 1.4, DY, 0, 0.2, 0.2, 2.8), face: "ink" },
  { b: box(DX, DY, 2.8, 1.6, 0.2, 0.2), face: "ink" },
  { b: box(DX + 0.2, DY + 0.2, 0, 0.12, 1.3, 2.75), face: "signal" },
];

const all = [...parts.map((p) => p.b), ...DOOR.map((p) => p.b)];
const corners = all.flatMap(([x0, x1, y0, y1, z0, z1]) => [P(x0, y1, z0, U), P(x1, y0, z0, U), P(x1, y1, z0, U), P(x0, y0, z1, U), P(x1, y1, z1, U)]);
const pad = 40;
const minX = Math.min(...corners.map((c) => c[0])) - pad;
const maxX = Math.max(...corners.map((c) => c[0])) + pad;
const minY = Math.min(...corners.map((c) => c[1])) - pad;
const maxY = Math.max(...corners.map((c) => c[1])) + pad;

/** Light falling through the open door onto the plate, a flat Signal patch on the floor. */
const light = [
  [DX + 0.2, DY + 0.2],
  [DX + 1.4, DY + 0.2],
  [DX + 1.9, DY + 2.2],
  [DX + 0.5, DY + 2.2],
]
  .map(([x, y]) => P(x!, y!, 0, U).map((n) => n.toFixed(1)).join(","))
  .join(" ");

/**
 * The auth illustration: the market as a skyline of candles, and in front of it one door standing
 * open in Signal, light on the floor. Blocks rise in row by row, the door last. Drawn in code with
 * the landing's iso kit; reduced motion shows it built.
 */
export function AccessScene({ className }: { className?: string }) {
  return (
    <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} preserveAspectRatio="xMidYMax slice" className={className} aria-hidden>
      <defs>
        <GrainDefs id={G} />
      </defs>
      {parts.map((p, k) => (
        <g key={k} className="as-rise" style={{ ["--i" as string]: k }}>
          {p.shadow && <Shadow b={p.b} u={U} />}
          <Block b={p.b} u={U} face={p.face} grain={G} />
        </g>
      ))}
      <g className="as-door">
        <Shadow b={DOOR[0]!.b} u={U} off={0.45} />
        <Block b={DOOR[0]!.b} u={U} face="white" grain={G} />
        <polygon points={light} fill="#FFD400" opacity={0.55} className="as-light" />
        {DOOR.slice(1).map((p, k) => (
          <Block key={k} b={p.b} u={U} face={p.face} grain={G} />
        ))}
      </g>
    </svg>
  );
}
