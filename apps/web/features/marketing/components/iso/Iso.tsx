import { P, ellipse, faces, pts, rot, silhouette, type B, type View } from "@/features/marketing/lib/iso";

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

// A side's colour between the lit left and the dark right, so a turning block shades continuously.
const mix = (a: string, b: string, t: number) =>
  t <= 0 ? a : t >= 1 ? b : `#${[1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, "0")).join("")}`;

/** One axis-aligned block: its visible sides and top, grain on lit faces, 0.9 px Ink hairline. */
export function Block({ b, u, face = "white", grain, view }: { b: B; u: number; face?: Face; grain?: string; view?: View }) {
  const s = FACE[face];
  return (
    <g>
      {faces(b, view).map((f, k) => {
        const p = pts(f.pts, u, view);
        return (
          <g key={k}>
            <polygon points={p} fill={f.top ? s.top : mix(s.left, s.right, f.shade)} />
            {s.grain && grain && <polygon points={p} fill={`url(#${grain})`} opacity={0.14} />}
            <polygon points={p} fill="none" {...line} />
          </g>
        );
      })}
    </g>
  );
}

/** Flat floor shadow: the footprint shifted `off` units down the screen (+x +y as the camera sees it), no blur. */
export function Shadow({ b, u, z = b[4], fill = "#E4E3DE", off = 0.35, view }: { b: B; u: number; z?: number; fill?: string; off?: number; view?: View }) {
  const [x0, x1, y0, y1] = b;
  const ps = ([[x0, y0], [x1, y0], [x1, y1], [x0, y1]] as const).map(([x, y]) => {
    const [rx, ry] = rot(x, y, view);
    return P(rx + off, ry + off, z, u).map((n) => n.toFixed(2)).join(",");
  });
  return <polygon points={ps.join(" ")} fill={fill} />;
}

/**
 * Something that builds out of the floor: the group starts pushed down by its own height and
 * is clipped to its final outline, so it reads as extruding, then rises on `[data-build]`.
 */
export function Rise({ id, b, u, from = b[4], at = 0, view, children }: { id: string; b: B; u: number; from?: number; at?: number; view?: View; children: React.ReactNode }) {
  const clip: B = [b[0], b[1], b[2], b[3], Math.min(from, b[4]), b[5]];
  return (
    <g clipPath={`url(#${id})`}>
      <clipPath id={id}>
        <polygon points={silhouette(clip, u, view)} />
      </clipPath>
      <g data-build="" data-dy={((b[5] - Math.min(from, b[4])) * u).toFixed(1)} data-at={at}>
        {children}
      </g>
    </g>
  );
}

/** Something that slides in along a world axis (a plate along its length, a card onto the desk). */
export function Slide({ v, u, at = 0, view, children }: { v: [number, number, number]; u: number; at?: number; view?: View; children: React.ReactNode }) {
  const [dx, dy] = P(v[0], v[1], v[2], u, view && { ...view, cx: 0, cy: 0 });
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
export function Cylinder({ cx, cy, z, r, h, u, view, children }: { cx: number; cy: number; z: number; r: number; h: number; u: number; view?: View; children?: React.ReactNode }) {
  const t = ellipse(cx, cy, z + h, r, u, view);
  const [, by] = P(cx, cy, z, u, view);
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
export const flat = (ps: [number, number][], z: number, u: number, view?: View) => ps.map(([x, y]) => P(x, y, z, u, view).map((n) => n.toFixed(2)).join(",")).join(" ");
