import { P, ellipse, faces, pts, silhouette, type B } from "@/features/marketing/lib/iso";

/** Block faces, lit from the back left (brand kit, "Faces, grain and floor shadow"). */
export const FACE = {
  white: { top: "#FFFFFF", left: "#EDECE8", right: "#1B1C1E", grain: true },
  graphite: { top: "#4A4C51", left: "#3A3C40", right: "#1B1C1E", grain: true },
  signal: { top: "#FFE45C", left: "#FFD400", right: "#E2BB00", grain: true },
  ink: { top: "#1B1C1E", left: "#1B1C1E", right: "#111214", grain: false },
} as const;
export type Face = keyof typeof FACE;

const INK = "#111214";
// The kit's grain: fractal noise (baseFrequency 1.1, 2 octaves, seed 7) as ink speckle, rasterised once per pattern.
const GRAIN =
  "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22160%22%20height%3D%22160%22%3E%3Cfilter%20id%3D%22g%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%221.1%22%20numOctaves%3D%222%22%20seed%3D%227%22%20stitchTiles%3D%22stitch%22/%3E%3CfeColorMatrix%20values%3D%220%200%200%200%200%20%200%200%200%200%200%20%200%200%200%200%200%20%200%200%200%20-2.4%201.25%22/%3E%3C/filter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url%28%23g%29%22/%3E%3C/svg%3E";

/** Paper grain as a pattern; every figure passes its own id so two SVGs never fight over one. */
export const GrainDefs = ({ id }: { id: string }) => (
  <pattern id={id} width={160} height={160} patternUnits="userSpaceOnUse">
    <image href={GRAIN} width={160} height={160} />
  </pattern>
);

const line = { stroke: INK, strokeWidth: 0.9, strokeLinejoin: "round" as const, vectorEffect: "non-scaling-stroke" as const };

/** One axis-aligned block: left, right and top faces, grain on lit faces, 0.9 px Ink hairline. */
export function Block({ b, u, face = "white", grain }: { b: B; u: number; face?: Face; grain?: string }) {
  const s = FACE[face];
  const f = faces(b);
  return (
    <g>
      {(["left", "right", "top"] as const).map((k) => {
        const p = pts(f[k], u);
        return (
          <g key={k}>
            <polygon points={p} fill={s[k]} />
            {s.grain && grain && <polygon points={p} fill={`url(#${grain})`} opacity={0.14} />}
            <polygon points={p} fill="none" {...line} />
          </g>
        );
      })}
    </g>
  );
}

/** Flat floor shadow: the footprint shifted 0.35 units along +x and +y, no blur. */
export function Shadow({ b, u, z = b[4], fill = "#E4E3DE" }: { b: B; u: number; z?: number; fill?: string }) {
  const [x0, x1, y0, y1] = b;
  return <polygon points={pts([[x0 + 0.35, y0 + 0.35, z], [x1 + 0.35, y0 + 0.35, z], [x1 + 0.35, y1 + 0.35, z], [x0 + 0.35, y1 + 0.35, z]], u)} fill={fill} />;
}

/**
 * Something that builds out of the floor: the group starts pushed down by its own height and
 * is clipped to its final outline, so it reads as extruding, then rises on `[data-build]`.
 */
export function Rise({ id, b, u, from = b[4], at = 0, children }: { id: string; b: B; u: number; from?: number; at?: number; children: React.ReactNode }) {
  const clip: B = [b[0], b[1], b[2], b[3], Math.min(from, b[4]), b[5]];
  return (
    <g clipPath={`url(#${id})`}>
      <clipPath id={id}>
        <polygon points={silhouette(clip, u)} />
      </clipPath>
      <g data-build="" data-dy={((b[5] - Math.min(from, b[4])) * u).toFixed(1)} data-at={at}>
        {children}
      </g>
    </g>
  );
}

/** Something that slides in along a world axis (a plate along its length, a card onto the desk). */
export function Slide({ v, u, at = 0, children }: { v: [number, number, number]; u: number; at?: number; children: React.ReactNode }) {
  const [dx, dy] = P(v[0], v[1], v[2], u);
  return (
    <g data-build="" data-dx={dx.toFixed(1)} data-dy={dy.toFixed(1)} data-fade="" data-at={at}>
      {children}
    </g>
  );
}

/** A straight leader: dot on the anchor, vertical then horizontal, drawn on `[data-on]`. */
export function Leader({ d, ax, ay, cue }: { d: string; ax: number; ay: number; cue: number }) {
  return (
    <g data-cue={cue}>
      <circle cx={ax} cy={ay} r={2.4} fill={INK} className="tv-dot" />
      <path d={d} pathLength={1} fill="none" stroke={INK} strokeWidth={0.8} vectorEffect="non-scaling-stroke" className="tv-leader" />
    </g>
  );
}

/** Upright cylinder with a face on top, for the session clock. */
export function Cylinder({ cx, cy, z, r, h, u, children }: { cx: number; cy: number; z: number; r: number; h: number; u: number; children?: React.ReactNode }) {
  const t = ellipse(cx, cy, z + h, r, u);
  const [, by] = P(cx, cy, z, u);
  const body = `M${t.cx - t.rx} ${t.cy}L${t.cx - t.rx} ${by}A${t.rx} ${t.ry} 0 0 0 ${t.cx + t.rx} ${by}L${t.cx + t.rx} ${t.cy}Z`;
  return (
    <g>
      <path d={body} fill="#1B1C1E" {...line} />
      <ellipse cx={t.cx} cy={t.cy} rx={t.rx} ry={t.ry} fill="#FFFFFF" {...line} />
      {children}
    </g>
  );
}

/** Polyline of points on a z plane, for arcs and ticks on a clock face. */
export const flat = (ps: [number, number][], z: number, u: number) => ps.map(([x, y]) => P(x, y, z, u).map((n) => n.toFixed(2)).join(",")).join(" ");
