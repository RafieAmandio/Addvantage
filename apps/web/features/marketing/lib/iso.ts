/**
 * True isometric (30 degree) projection, ported from the brand kit's src/iso.py.
 * World axes: x runs 30 degrees down-right, y 30 degrees down-left, z up. The viewer looks
 * from +x +y +z, so a block shows its top, its x-max face (right) and its y-max face (left).
 * Self-check: npx tsx features/marketing/lib/iso.check.ts
 */
export const C = Math.cos(Math.PI / 6);
export const S = 0.5;

export type V3 = [number, number, number];
/** Axis-aligned bounds: x0, x1, y0, y1, z0, z1. */
export type B = [number, number, number, number, number, number];

export const P = (x: number, y: number, z: number, u = 1): [number, number] => [(x - y) * C * u, (x + y) * S * u - z * u];

const f = (n: number) => n.toFixed(2);
export const pts = (ps: V3[], u: number) => ps.map((p) => P(p[0], p[1], p[2], u).map(f).join(",")).join(" ");

export const box = (x: number, y: number, z: number, w: number, d: number, h: number): B => [x, x + w, y, y + d, z, z + h];

/** The three visible faces of a block, as world polygons. */
export function faces([x0, x1, y0, y1, z0, z1]: B) {
  return {
    left: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]] as V3[],
    right: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]] as V3[],
    top: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]] as V3[],
  };
}

const corners = ([x0, x1, y0, y1, z0, z1]: B): V3[] => [x0, x1].flatMap((x) => [y0, y1].flatMap((y) => [z0, z1].map((z) => [x, y, z] as V3)));

/** The block's screen outline (a hexagon), for clipping a block that extrudes out of the floor. */
export function silhouette(b: B, u: number) {
  const ps = corners(b).map((c) => P(c[0], c[1], c[2], u));
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
  return [...half(ps), ...half([...ps].reverse())].map((p) => p.map(f).join(",")).join(" ");
}

/** A circle lying on a z plane: in true iso it is an axis-aligned ellipse. */
export function ellipse(cx: number, cy: number, z: number, r: number, u: number) {
  const [x, y] = P(cx, cy, z, u);
  return { cx: x, cy: y, rx: r * Math.SQRT2 * C * u, ry: r * Math.SQRT2 * S * u };
}

// Screen hexagons of two blocks overlap iff their ranges along x-y, x-z and y-z all overlap.
function overlap(a: B, b: B, e = 1e-6) {
  const fns = [(x: number, y: number) => x - y, (x: number, _y: number, z: number) => x - z, (_x: number, y: number, z: number) => y - z];
  return fns.every((fn) => {
    const r = (q: B) => {
      const v = corners(q).map((c) => fn(c[0], c[1], c[2]));
      return [Math.min(...v), Math.max(...v)] as const;
    };
    const [la, ha] = r(a);
    const [lb, hb] = r(b);
    return !(ha <= lb + e || hb <= la + e);
  });
}
const behind = (a: B, b: B, e = 1e-6) => a[1] <= b[0] + e || a[3] <= b[2] + e || a[5] <= b[4] + e;

/** Topological painter's order for blocks that never intersect. */
export function depthSort<T extends { b: B }>(items: T[]): T[] {
  const n = items.length;
  const after = items.map(() => new Set<number>());
  const indeg = items.map(() => 0);
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const a = items[i]!.b;
      const b = items[j]!.b;
      if (!overlap(a, b)) continue;
      if (behind(a, b)) after[i]!.add(j);
      else if (behind(b, a)) after[j]!.add(i);
    }
  after.forEach((s) => s.forEach((j) => indeg[j]!++));
  const key = (i: number) => items[i]!.b[0] + items[i]!.b[2] + items[i]!.b[4] + i * 1e-9;
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
export function viewBox(bs: B[], u: number, pad: [number, number, number, number] = [20, 20, 20, 20]) {
  const ps = bs.flatMap((b) => corners(b).map((c) => P(c[0], c[1], c[2], u)));
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
export function leader(anchor: V3, u: number, { dy = -40, dx = 60, col }: { dy?: number; dx?: number; col?: number } = {}) {
  const [ax, ay] = P(anchor[0], anchor[1], anchor[2], u);
  const ey = ay + dy;
  const hx = col ?? ax + dx;
  return { ax, ay, ex: hx, ey, d: `M${f(ax)} ${f(ay)}V${f(ey)}H${f(hx)}`, side: hx >= ax ? ("start" as const) : ("end" as const) };
}
