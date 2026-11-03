/**
 * True isometric (30 degree) projection, ported from the brand kit's src/iso.py.
 * World axes: x runs 30 degrees down-right, y 30 degrees down-left, z up. The viewer looks
 * from +x +y +z, so a block shows its top, its x-max face (right) and its y-max face (left).
 * An optional View turns the world about a vertical axis first (azimuth), elevation stays 30 degrees.
 * Self-check: npx tsx features/marketing/lib/iso.check.ts
 */
export const C = Math.cos(Math.PI / 6);
export const S = 0.5;

export type V3 = [number, number, number];
/** Axis-aligned bounds: x0, x1, y0, y1, z0, z1. */
export type B = [number, number, number, number, number, number];

/** Azimuth in degrees about the vertical line through (cx, cy). Positive turns the scene to the right. */
export type View = { az: number; cx: number; cy: number };

/** World x, y in the turned frame (the frame the fixed 30 degree camera sees). */
export function rot(x: number, y: number, v?: View): [number, number] {
  if (!v || !v.az) return [x, y];
  const a = (v.az * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const dx = x - v.cx;
  const dy = y - v.cy;
  return [v.cx + dx * c + dy * s, v.cy - dx * s + dy * c];
}

export const P = (x: number, y: number, z: number, u = 1, v?: View): [number, number] => {
  const [rx, ry] = rot(x, y, v);
  return [(rx - ry) * C * u, (rx + ry) * S * u - z * u];
};
/** How near the viewer a point is: larger is nearer. */
export const depth = (p: V3, v?: View) => {
  const [rx, ry] = rot(p[0], p[1], v);
  return rx + ry + p[2];
};

const f = (n: number) => n.toFixed(2);
export const pts = (ps: V3[], u: number, v?: View) => ps.map((p) => P(p[0], p[1], p[2], u, v).map(f).join(",")).join(" ");

export const box = (x: number, y: number, z: number, w: number, d: number, h: number): B => [x, x + w, y, y + d, z, z + h];

/**
 * The visible faces of a block, as world polygons, sides first, top last. `shade` is where a side
 * sits between the lit left (0) and the dark right (1) as the camera sees it, so the light stays
 * fixed in view while the scene turns. At azimuth 0 these are the y-max (0) and x-max (1) faces.
 */
export function faces([x0, x1, y0, y1, z0, z1]: B, v?: View) {
  const sides: [number, number, V3[]][] = [
    [0, 1, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]],
    [1, 0, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]],
    [0, -1, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]]],
    [-1, 0, [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]]],
  ];
  const out: { pts: V3[]; shade: number; top?: true }[] = [];
  for (const [nx, ny, ps] of sides) {
    const [rx, ry] = rot(nx, ny, v && { ...v, cx: 0, cy: 0 });
    if (rx + ry > 1e-6) out.push({ pts: ps, shade: Math.round(Math.min(1, Math.max(0, (rx - ry + 1) / 2)) * 1e6) / 1e6 });
  }
  out.push({ pts: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], shade: 0, top: true });
  return out;
}

const corners = ([x0, x1, y0, y1, z0, z1]: B): V3[] => [x0, x1].flatMap((x) => [y0, y1].flatMap((y) => [z0, z1].map((z) => [x, y, z] as V3)));

/** The block's screen outline as points (convex hull, clockwise on screen). */
export function hull(b: B, u: number, v?: View): [number, number][] {
  const ps = corners(b).map((c) => P(c[0], c[1], c[2], u, v));
  ps.sort((a, c) => a[0] - c[0] || a[1] - c[1]);
  const cross = (o: number[], a: number[], c: number[]) => (a[0]! - o[0]!) * (c[1]! - o[1]!) - (a[1]! - o[1]!) * (c[0]! - o[0]!);
  const half = (list: [number, number][]) => {
    const h: [number, number][] = [];
    for (const p of list) {
      while (h.length >= 2 && cross(h[h.length - 2]!, h[h.length - 1]!, p) <= 0) h.pop();
      h.push(p);
    }
    h.pop();
    return h;
  };
  return [...half(ps), ...half([...ps].reverse())];
}

/** The block's screen outline (a hexagon), for clipping a block that extrudes out of the floor. */
export const silhouette = (b: B, u: number, v?: View) => hull(b, u, v).map((p) => p.map(f).join(",")).join(" ");

/** A circle lying on a z plane: in true iso it is an axis-aligned ellipse. */
export function ellipse(cx: number, cy: number, z: number, r: number, u: number, v?: View) {
  const [x, y] = P(cx, cy, z, u, v);
  return { cx: x, cy: y, rx: r * Math.SQRT2 * C * u, ry: r * Math.SQRT2 * S * u };
}

// Two convex screen outlines overlap unless some edge of either separates them.
function overlap(a: [number, number][], b: [number, number][], e = 1e-6) {
  for (const poly of [a, b])
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i]!;
      const q = poly[(i + 1) % poly.length]!;
      const nx = q[1] - p[1];
      const ny = p[0] - q[0];
      const r = (ps: [number, number][]) => ps.map((s) => s[0] * nx + s[1] * ny);
      const ra = r(a);
      const rb = r(b);
      const len = Math.hypot(nx, ny) || 1;
      if (Math.max(...ra) <= Math.min(...rb) + e * len || Math.max(...rb) <= Math.min(...ra) + e * len) return false;
    }
  return true;
}
// a is behind b when a plane between them faces the viewer: along x or y whichever way the camera
// looks after the turn, and along z always (the camera is above).
function behind(a: B, b: B, d: [number, number], e = 1e-6) {
  if (d[0] > e ? a[1] <= b[0] + e : d[0] < -e && a[0] >= b[1] - e) return true;
  if (d[1] > e ? a[3] <= b[2] + e : d[1] < -e && a[2] >= b[3] - e) return true;
  return a[5] <= b[4] + e;
}

/** Topological painter's order for blocks that never intersect, for any azimuth. */
export function depthSort<T extends { b: B }>(items: T[], v?: View): T[] {
  const n = items.length;
  const hs = items.map((it) => hull(it.b, 1, v));
  // The camera direction (+x +y in the turned frame) back in world axes.
  const d = rot(1, 1, v && { az: -v.az, cx: 0, cy: 0 });
  const after = items.map(() => new Set<number>());
  const indeg = items.map(() => 0);
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const a = items[i]!.b;
      const b = items[j]!.b;
      if (!overlap(hs[i]!, hs[j]!)) continue;
      if (behind(a, b, d)) after[i]!.add(j);
      else if (behind(b, a, d)) after[j]!.add(i);
    }
  after.forEach((s) => s.forEach((j) => indeg[j]!++));
  const key = (i: number) => {
    const b = items[i]!.b;
    return depth([(b[0] + b[1]) / 2, (b[2] + b[3]) / 2, b[4]], v) + i * 1e-9;
  };
  const ready = items.map((_, i) => i).filter((i) => indeg[i] === 0);
  const order: number[] = [];
  while (ready.length) {
    ready.sort((a, b) => key(a) - key(b));
    const i = ready.shift()!;
    order.push(i);
    after[i]!.forEach((j) => --indeg[j]! === 0 && ready.push(j));
  }
  if (order.length !== n) throw new Error("depth cycle: two blocks intersect");
  return order.map((i) => items[i]!);
}

/** Screen bounds of a set of blocks, as an SVG viewBox. */
export function viewBox(bs: B[], u: number, pad: [number, number, number, number] = [20, 20, 20, 20], vs: (View | undefined)[] = [undefined]) {
  const ps = vs.flatMap((v) => bs.flatMap((b) => corners(b).map((c) => P(c[0], c[1], c[2], u, v))));
  const xs = ps.map((p) => p[0]);
  const ys = ps.map((p) => p[1]);
  const [t, r, b, l] = pad;
  const x = Math.min(...xs) - l;
  const y = Math.min(...ys) - t;
  return { x, y, w: Math.max(...xs) + r - x, h: Math.max(...ys) + b - y };
}

/**
 * A plain spec label: dot on the anchor, a straight leader that goes vertical then horizontal,
 * unboxed text. `col` is the absolute screen x where the leader ends, so labels line up.
 */
export function leader(anchor: V3, u: number, { dy = -40, dx = 60, col }: { dy?: number; dx?: number; col?: number } = {}, v?: View) {
  const [ax, ay] = P(anchor[0], anchor[1], anchor[2], u, v);
  const ey = ay + dy;
  const hx = col ?? ax + dx;
  return { ax, ay, ex: hx, ey, d: `M${f(ax)} ${f(ay)}V${f(ey)}H${f(hx)}`, side: hx >= ax ? ("start" as const) : ("end" as const) };
}
