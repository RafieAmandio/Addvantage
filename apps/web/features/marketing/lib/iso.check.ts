// Run from apps/web: npx tsx features/marketing/lib/iso.check.ts (same asserts as the kit's iso.py)
import assert from "node:assert/strict";
import { P, box, depthSort, silhouette } from "./iso";

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
console.log("iso ok");
