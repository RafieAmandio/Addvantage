// Run from apps/web: npx tsx features/marketing/lib/iso.check.ts (same asserts as the kit's iso.py)
import assert from "node:assert/strict";
import { P, box, depthSort, faces, silhouette, type View } from "./iso";

// Unit x is 30 degrees below horizontal.
const [x, y] = P(1, 0, 0);
assert.ok(Math.abs((Math.atan2(y, x) * 180) / Math.PI - 30) < 1e-9);
const item = (b: ReturnType<typeof box>, name: string) => ({ b, name });
// A block in front (bigger x) of another is painted after it.
assert.deepEqual(depthSort([item(box(1, 0, 0, 1, 1, 1), "front"), item(box(0, 0, 0, 1, 1, 1), "back")]).map((i) => i.name), ["back", "front"]);
// A block on top is painted after the one below.
assert.deepEqual(depthSort([item(box(0, 0, 1, 1, 1, 1), "high"), item(box(0, 0, 0, 1, 1, 1), "low")]).map((i) => i.name), ["low", "high"]);
// A thin rod under a block (a lower wick) is painted before the block.
assert.deepEqual(depthSort([item(box(0, 0, 1, 1, 1, 1), "body"), item(box(0.45, 0.45, 0.8, 0.1, 0.1, 0.2), "rod")]).map((i) => i.name), ["rod", "body"]);
// A block's outline is a hexagon.
assert.equal(silhouette(box(0, 0, 0, 1, 1, 1), 10).split(" ").length, 6);

// Azimuth: a quarter turn about the origin maps unit x onto where unit y was drawn (scene turns right),
// and a zero turn changes nothing.
const q: View = { az: 90, cx: 0, cy: 0 };
const near = (a: number[], b: number[]) => a.every((n, i) => Math.abs(n - b[i]!) < 1e-9);
assert.ok(near(P(1, 0, 0, 1, q), P(0, -1, 0)));
assert.ok(near(P(3, 2, 1, 7, { az: 0, cx: 5, cy: 5 }), P(3, 2, 1, 7)));
// The pivot stays put on screen.
assert.ok(near(P(4, 6, 0, 1, { az: 37, cx: 4, cy: 6 }), P(4, 6, 0)));
// After a half turn the order of two blocks along x flips. Turning right by a quarter puts the camera on
// the -x side (+x is now further away); three quarters puts it back on +x.
const pair = [item(box(1, 0, 0, 1, 1, 1), "plusX"), item(box(0, 0, 0, 1, 1, 1), "minusX")];
assert.deepEqual(depthSort(pair, { az: 180, cx: 1, cy: 0.5 }).map((i) => i.name), ["plusX", "minusX"]);
assert.deepEqual(depthSort(pair, { az: 90, cx: 1, cy: 0.5 }).map((i) => i.name), ["plusX", "minusX"]);
assert.deepEqual(depthSort(pair, { az: 270, cx: 1, cy: 0.5 }).map((i) => i.name), ["minusX", "plusX"]);
// Every quarter view shows a top and exactly two sides, one lit (0) and one dark (1); 45 degrees shows a face head on.
for (const az of [0, 90, 180, 270]) {
  const fs = faces(box(0, 0, 0, 1, 1, 1), { az, cx: 0, cy: 0 });
  assert.deepEqual(fs.map((f) => (f.top ? "top" : f.shade)).sort(), [0, 1, "top"].sort());
}
assert.ok(faces(box(0, 0, 0, 1, 1, 1), { az: 45, cx: 0, cy: 0 }).some((f) => !f.top && Math.abs(f.shade - 0.5) < 1e-9));
// A row of blocks on a slab sorts without cycles at every angle.
const row = [item(box(0, 0, 0, 3, 10, 0.2), "slab"), ...[0, 1, 2, 3, 4].map((i) => item(box(1, i * 2, 0.2, 1, 1, 1 + i * 0.3), `c${i}`))];
for (let az = 0; az < 360; az += 7.5) depthSort(row, { az, cx: 1.5, cy: 5 })[0]!.name === "slab" || assert.fail(`slab not first at ${az}`);
console.log("iso ok");
