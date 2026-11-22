import { P, box, type B } from "@/features/marketing/lib/iso";
import { Block, GrainDefs, type Face } from "@/features/marketing/components/iso/Iso";
import "./access-scene.css";

const U = 34;
const G = "tvg-access";

// A hillside of stacked cubes (a heightmap of unit voxels), a clear path up the middle to a tall
// door frame standing open, the doorway lit in Signal. Cloud blocks float above the back.
const GX = 15;
const GY = 11;
const DX = 5.5; // door frame's left edge
const DY = 4; // the frame stands in the plane y = DY
const DW = 3.4;
const DH = 7.8;
const T = 0.4; // frame thickness

const rnd = (x: number, y: number) => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const onPath = (x: number, y: number) => y >= DY && x >= DX - 0.5 && x <= DX + DW + (y - DY) * 0.5;
function height(x: number, y: number) {
  if (onPath(x, y)) return 0;
  const back = Math.max(0, DY - y) * 0.42; // the hill climbs behind the door
  const side = Math.abs(x + 0.5 - (DX + DW / 2)) * 0.26;
  return Math.max(0, Math.min(5, Math.round(back + side + rnd(x, y) * 1.6 - 0.6)));
}

type Vox = { b: B; face: Face; d: number };
const vox: Vox[] = [];
for (let x = 0; x < GX; x++)
  for (let y = 0; y < GY; y++)
    for (let z = 0; z < height(x, y); z++) vox.push({ b: box(x, y, z, 1, 1, 1), face: rnd(x * 3 + z, y * 5 + z) < 0.14 ? "graphite" : "white", d: x + y + z });
vox.sort((a, b) => a.d - b.d);
const behind = vox.filter((v) => v.b[2] < DY);
const front = vox.filter((v) => v.b[2] >= DY);

const FRAME: B[] = [box(DX, DY, 0, T, T, DH), box(DX + DW - T, DY, 0, T, T, DH), box(DX, DY, DH, DW, T, T)];
const LEAF = box(DX + T, DY + T, 0, 0.16, DW - 2 * T - 0.2, DH - 0.05); // swung open toward the viewer
const CLOUDS: B[] = [box(0.5, -1.5, 7.6, 3.4, 2, 0.6), box(1.3, -1.1, 8.2, 1.7, 1.2, 0.5), box(9.5, -2.5, 9, 3.8, 2.2, 0.6), box(10.4, -2, 9.6, 1.9, 1.2, 0.5)];

const poly = (ps: [number, number, number][]) => ps.map(([x, y, z]) => P(x, y, z, U).map((n) => n.toFixed(1)).join(",")).join(" ");
const yf = DY + T; // the frame's front plane
const OPENING = poly([[DX + T, yf, 0], [DX + DW - T, yf, 0], [DX + DW - T, yf, DH], [DX + T, yf, DH]]);
const SPILL = poly([[DX + T, yf, 0], [DX + DW - T, yf, 0], [DX + DW + 1.2, yf + 4.5, 0], [DX + T + 1.4, yf + 4.5, 0]]);

const pts = [...vox.map((v) => v.b), ...FRAME, ...CLOUDS].flatMap(([x0, x1, y0, y1, z0, z1]) => [P(x0, y1, z0, U), P(x1, y0, z0, U), P(x1, y1, z0, U), P(x0, y0, z1, U)]);
const minX = Math.min(...pts.map((p) => p[0])) - 20;
const maxX = Math.max(...pts.map((p) => p[0])) + 20;
const minY = Math.min(...pts.map((p) => p[1])) - 30;
const maxY = Math.max(...pts.map((p) => p[1])) + 20;

const Cube = ({ v }: { v: Vox }) => (
  <g className="as-rise" style={{ ["--i" as string]: v.d }}>
    <Block b={v.b} u={U} face={v.face} grain={G} />
  </g>
);

/**
 * The auth illustration: a hillside of cubes, a clear path up to a tall door frame standing open,
 * the doorway and the floor in front of it lit Signal, cloud blocks above. Built in code with the
 * landing's iso kit; cubes rise in from the back, then the door, then the light.
 */
export function AccessScene({ className }: { className?: string }) {
  return (
    <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <GrainDefs id={G} />
      </defs>
      <g className="as-cloud">
        {CLOUDS.map((b, k) => (
          <Block key={k} b={b} u={U} grain={G} />
        ))}
      </g>
      {behind.map((v, k) => (
        <Cube key={k} v={v} />
      ))}
      <g className="as-door">
        <polygon points={SPILL} fill="#FFD400" opacity={0.5} className="as-light" />
        <polygon points={OPENING} fill="#FFD400" className="as-light" />
        {FRAME.map((b, k) => (
          <Block key={k} b={b} u={U} face="ink" />
        ))}
        <Block b={LEAF} u={U} face="white" grain={G} />
      </g>
      {front.map((v, k) => (
        <Cube key={k} v={v} />
      ))}
    </svg>
  );
}
