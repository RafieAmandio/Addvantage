"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { HeroData } from "@/features/marketing/lib/landing";
import { C, P, S, box, depth, depthSort, hull, leader, pts, rot, silhouette, viewBox, type B, type V3, type View } from "@/features/marketing/lib/iso";
import { Block, Cylinder, GrainDefs, Leader, Rise, Shadow, Slide, flat, type Face } from "./iso/Iso";
import { Build, playBuild } from "./iso/Build";
import { CopyPrice } from "./iso/CopyPrice";
import { Ticker } from "./iso/Ticker";
import { CalloutLabel, CalloutPath, callout, inside, useInspect, type Info } from "./iso/Inspect";

const U = 40;
const G = "tvg-hero";
// Kit hero layout (src/kit.py scene_items), in world units.
const BASE_Z = 0.22;
const CX = 1.7;
const CW = 0.95;
const WICK = 0.16;
const STEP = 1.4;
const TOWERS: [number, number, number][] = [
  [8.6, 1.0, 4.6],
  [12.3, 1.0, 3.0],
  [16.0, 1.0, 1.8],
];
const CLOCK = { cx: 7.6, cy: 8.4, r: 2.3, h: 0.5 };
const SESSIONS: [string, number, number][] = [
  ["Asia", 7, 16],
  ["London", 15, 24],
  ["New York", 20, 29],
];
// The desk turns about its own centre, so the scene stays put in the frame while it turns.
const PIVOT = { cx: 9.5, cy: 6.5 };
const DESK = box(0, 0, -0.35, 19, 13, 0.35);
const LIFT = 9; // user units, about 4 px at desktop size

type Item = { id: string; b: B; info?: Info; anchor?: V3; el: (v: View) => React.ReactNode };

/** The session clock's face: 24 h WIB dial, Asia, London and New York arcs, the hand on `hour`. */
function ClockFace({ hour, view }: { hour: number; view: View }) {
  const { cx, cy, r, h } = CLOCK;
  const z = h;
  const at = (rr: number, t: number): [number, number] => [cx + rr * Math.cos((2 * Math.PI * t) / 24), cy + rr * Math.sin((2 * Math.PI * t) / 24)];
  return (
    <g stroke="#111214" fill="none" vectorEffect="non-scaling-stroke">
      {Array.from({ length: 24 }, (_, i) => (
        <polyline key={i} points={flat([at(r * (i % 6 ? 0.88 : 0.8), i), at(r * 0.95, i)], z, U, view)} strokeWidth={i % 6 ? 0.7 : 1.1} />
      ))}
      {SESSIONS.map(([, a, b], j) => (
        <polyline key={j} points={flat(Array.from({ length: 41 }, (_, q) => at(r * (0.68 - j * 0.1), a + ((b - a) * q) / 40)), z, U, view)} strokeWidth={j === 1 ? 2.2 : 1.3} />
      ))}
      <polyline points={flat([[cx, cy], at(r * 0.74, hour)], z, U, view)} strokeWidth={1.6} />
    </g>
  );
}

/** A point on a block's top, pulled toward its back corner, so a leader going up never crosses the block. */
function topAnchor(b: B, v: View, k = 0.7): V3 {
  const cx = (b[0] + b[1]) / 2;
  const cy = (b[2] + b[3]) / 2;
  const back = ([[b[0], b[2]], [b[1], b[2]], [b[0], b[3]], [b[1], b[3]]] as const).reduce((m, c) => (depth([c[0], c[1], 0], v) < depth([m[0], m[1], 0], v) - 1e-9 ? c : m));
  return [cx + k * (back[0] - cx), cy + k * (back[1] - cy), b[5]];
}

const reduced = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const ease = (k: number) => 1 - Math.pow(1 - k, 5); // --tv-ease-out, near enough

/**
 * The hero: the brand's isometric desk, drawn in code from a real hourly rejection. Candles
 * extrude one by one, the key level plate slides in, and the yellow candle wicks past the
 * level, then the part past it sinks back: rejected. Labels carry the exact prices.
 * It is also a thing to play with: hover, tap or tab to any object to inspect it, drag or swipe
 * (or arrow keys) to turn the desk, it settles on the four true isometric views. Clicking the
 * yellow candle replays the rejection.
 */
export function HeroDesk({ d, className }: { d: HeroData; className?: string }) {
  const [az, setAzState] = useState(0);
  const [touched, setTouched] = useState(false);
  const azRef = useRef(0);
  const tween = useRef(0);
  const goal = useRef(0); // the quarter the desk is settling on
  const root = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; az: number; id: number; on: boolean; last: number; t: number; v: number } | null>(null);
  const eat = useRef(false);
  const par = useRef(0);
  const { active, ring, bind, clear } = useInspect();
  // Your key level: null is the real one. Dragged along z, it snaps to the instrument's tick.
  const [mine, setMine] = useState<number | null>(null);
  const lvlDrag = useRef<{ id: number; y: number; p: number } | null>(null);
  const heat = useRef(new Map<string, number>());
  const heatLayer = useRef<SVGGElement>(null);
  const heatRaf = useRef(0);
  const viewRef = useRef<View>({ az: 0, ...PIVOT });
  useEffect(() => () => (cancelAnimationFrame(tween.current), cancelAnimationFrame(par.current), cancelAnimationFrame(heatRaf.current)), []);

  // A touch that starts on the plate drags the level, not the page (touch-action on SVG is not reliable).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const hold = (e: TouchEvent) => (e.target as Element).closest?.("[data-level]") && e.preventDefault();
    el.addEventListener("touchstart", hold, { passive: false });
    return () => el.removeEventListener("touchstart", hold);
  }, []);

  // Scroll exit: as the hero leaves, the desk tips back a few degrees and drifts up. Scroll-linked,
  // transform only; it reads window.scrollY, which Lenis drives, so the two never disagree.
  useEffect(() => {
    const el = root.current;
    if (!el || reduced()) return;
    let raf = 0;
    let seen = true;
    const io = new IntersectionObserver(([e]) => (seen = !!e?.isIntersecting));
    io.observe(el);
    const on = () => {
      if (!seen || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        el.style.setProperty("--exit", Math.min(1, Math.max(0, scrollY / innerHeight)).toFixed(3));
      });
    };
    addEventListener("scroll", on, { passive: true });
    on();
    return () => {
      io.disconnect();
      removeEventListener("scroll", on);
      cancelAnimationFrame(raf);
    };
  }, []);

  const setAz = (a: number) => {
    azRef.current = a;
    setAzState(a);
  };
  const turnTo = (to: number) => {
    cancelAnimationFrame(tween.current);
    goal.current = to;
    const from = azRef.current;
    if (reduced() || from === to) return setAz(to);
    const t0 = performance.now();
    const ms = 420 + Math.min(1, Math.abs(to - from) / 90) * 200;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      setAz(from + (to - from) * ease(k));
      if (k < 1) tween.current = requestAnimationFrame(step);
    };
    tween.current = requestAnimationFrame(step);
  };
  const snap = (a: number) => Math.round(a / 90) * 90;

  const view: View = { az, ...PIVOT };
  viewRef.current = view;
  const grid = Array.from({ length: 49 }, (_, k) => k - 15)
    .flatMap((k) => [
      [P(k, -15, -0.35, U, view), P(k, 28, -0.35, U, view)],
      ...(k <= 28 ? [[P(-15, k, -0.35, U, view), P(34, k, -0.35, U, view)]] : []),
    ])
    .map(([a, b]) => `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`)
    .join("");
  const n = d.bars.length;
  const lo = Math.min(d.level, ...d.bars.map((b) => b[3]));
  const hi = Math.max(d.level, ...d.bars.map((b) => b[2]));
  const z = (p: number) => BASE_Z + 0.3 + ((p - lo) / (hi - lo || 1)) * 6.0;
  const dec = d.fmt.level.split(".")[1]?.length ?? 0;
  const tick = 10 ** -dec;
  const lvlP = mine ?? d.level;
  const zL = z(lvlP);
  const lvlText = mine === null ? d.fmt.level : mine.toFixed(dec);
  const crossed = mine === null ? [] : d.bars.map((b) => b[3] <= mine && mine <= b[2]);
  const sell = d.side === "sell";
  const LIVE_AT = 300 + (n - 1) * 150;
  const hour = Number(d.fmt.time.slice(-9, -7)) + Number(d.fmt.time.slice(-6, -4)) / 60;
  const open = SESSIONS.filter(([, a, b]) => (hour - a + 24) % 24 < b - a).map(([s]) => s);

  // Replay the candle build and the rejection, as if the hour printed again.
  const replay = () => {
    const el = front.current;
    if (!el || reduced()) return;
    // ponytail: candles found by their Rise clip id (hx-c*), tag them if Rise ever changes its markup.
    const builds = [...el.querySelectorAll<SVGElement>('[clip-path^="url(#hx-c"] > [data-build]')];
    const exts = [...el.querySelectorAll<SVGElement>("[data-ext]")];
    const cues = [...el.querySelectorAll<HTMLElement | SVGElement>(`[data-cue="${LIVE_AT + 1500}"]`)];
    [...builds, ...exts].forEach((x) => x.getAnimations().forEach((a) => a.cancel()));
    cues.forEach((c) => c.removeAttribute("data-on"));
    playBuild(builds, cues, exts, 300);
  };

  const items: Item[] = [];
  const base = box(0.5, 0.6, 0, 3.0, 11.8, BASE_Z);
  items.push({ id: "base", b: base, el: (v) => <Block b={base} u={U} grain={G} view={v} /> });

  // The plate runs past the live candle at the back, so the wick can be seen going through it.
  const plate = box(0.6, -1.4, zL - 0.04, 0.85, 13.8, 0.08);
  items.push({
    id: "level",
    b: plate,
    info: {
      main: "Key level",
      aria: `Key level ${d.sym} ${lvlText}. Drag it, or use the up and down arrows, to move it one tick`,
      onKey: (e) => {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return false;
        e.preventDefault();
        e.stopPropagation();
        const step = (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? 10 : 1);
        setMine(clampP(lvlP + step * tick));
        return true;
      },
    },
    el: (v) => (
      <Slide v={[0, 5, 0]} u={U} at={700} view={v}>
        <Block b={plate} u={U} face="ink" view={v} />
      </Slide>
    ),
  });

  d.bars.forEach(([, o, h, l, c], i) => {
    const y = 1.2 + (n - 1 - i) * STEP;
    const live = i === n - 1;
    const face: Face = live ? "signal" : c >= o ? "white" : "graphite";
    const b0 = z(Math.min(o, c));
    const b1 = Math.max(z(Math.max(o, c)), b0 + 0.06);
    const body = box(CX, y, b0, CW, CW, b1 - b0);
    const wx = CX + CW / 2 - WICK / 2;
    const wy = y + CW / 2 - WICK / 2;
    const lowW = z(l) < b0 ? box(wx, wy, z(l), WICK, WICK, b0 - z(l)) : null;
    const upW = z(h) > b1 ? box(wx, wy, b1, WICK, WICK, z(h) - b1) : null;
    const all: B = [CX, CX + CW, y, y + CW, Math.min(z(l), b0), Math.max(z(h), b1)];
    // The live candle first prints to its extreme as a full body, then the part past the level sinks back.
    const ext = live ? (sell ? box(CX, y, b1, CW, CW, z(h) - b1) : box(CX, y, z(l), CW, CW, b0 - z(l))) : null;
    const extEl = (v: View) =>
      ext && (
        <g clipPath={`url(#hx-ext)`}>
          <clipPath id="hx-ext">
            <polygon points={silhouette(ext, U, v)} />
          </clipPath>
          <g data-ext="" data-dy={((sell ? 1 : -1) * (ext[5] - ext[4]) * U).toFixed(1)} data-at={LIVE_AT + 500}>
            <Block b={ext} u={U} face="signal" grain={G} view={v} />
          </g>
        </g>
      );
    const t = d.fmt.bars[i]!;
    items.push({
      id: `c${i}`,
      b: all,
      anchor: [CX + CW / 2, y + CW / 2, all[5]],
      info: {
        main: `${d.sym} ${t.time}`,
        lines: [`O ${t.o} H ${t.h}`, `L ${t.l} C ${t.c}`, ...(live ? ["Click to replay"] : [])],
        aria: `${d.sym} candle ${t.time}: open ${t.o}, high ${t.h}, low ${t.l}, close ${t.c}${live ? ". Press to replay the rejection" : ""}`,
        onPress: live ? replay : undefined,
      },
      el: (v) => (
        <Rise id={`hx-c${i}`} b={all} u={U} from={BASE_Z} at={300 + i * 150} view={v}>
          {lowW && <Block b={lowW} u={U} face="ink" view={v} />}
          {!sell && extEl(v)}
          <Block b={body} u={U} face={face} grain={G} view={v} />
          {upW && <Block b={upW} u={U} face="ink" view={v} />}
          {sell && extEl(v)}
          {crossed[i] && <polygon points={silhouette(body, U, v)} fill="none" stroke="#111214" strokeWidth={1.6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" pointerEvents="none" />}
        </Rise>
      ),
    });
  });

  TOWERS.forEach(([x, y, h], j) => {
    const b = box(x, y, 0, 2.3, 2.3, h);
    const t = d.towers[j];
    items.push({
      id: `t${j}`,
      b,
      info: t && { main: `${t.sym} ${t.chg}`, lines: [`Last ${t.val}`], aria: `${t.sym} last close ${t.val}, ${t.chg} on the day` },
      el: (v) => (
        <Rise id={`hx-t${j}`} b={b} u={U} at={120 + j * 110} view={v}>
          <Block b={b} u={U} grain={G} view={v} />
        </Rise>
      ),
    });
  });

  const clockB: B = [CLOCK.cx - CLOCK.r, CLOCK.cx + CLOCK.r, CLOCK.cy - CLOCK.r, CLOCK.cy + CLOCK.r, 0, CLOCK.h];
  const stamp = d.fmt.time.slice(-9);
  items.push({
    id: "clock",
    b: clockB,
    anchor: [CLOCK.cx, CLOCK.cy, CLOCK.h],
    info: {
      main: "Session clock",
      lines: [stamp, open.length ? `${open.join(" + ")} open` : "All sessions shut"],
      aria: `Session clock at ${stamp}: ${open.length ? `${open.join(" and ")} open` : "all sessions shut"}`,
    },
    el: (v) => (
      <Slide v={[0, 0, 1.2]} u={U} at={260} view={v}>
        <Cylinder cx={CLOCK.cx} cy={CLOCK.cy} z={0} r={CLOCK.r} h={CLOCK.h} u={U} view={v}>
          <ClockFace hour={hour} view={v} />
        </Cylinder>
      </Slide>
    ),
  });

  const journal = box(14.2, 9.4, 0, 3.4, 2.4, 0.28);
  items.push({
    id: "journal",
    b: journal,
    info: { main: "Journal", lines: ["2% max risk, built in"], aria: "Trade journal, 2% max risk built in" },
    el: (v) => (
      <Slide v={[0, 0, 1.2]} u={U} at={380} view={v}>
        <Block b={journal} u={U} grain={G} view={v} />
        <path
          d={[0, 1, 2, 3, 4]
            .map((i) => {
              const yy = 9.4 + 0.45 + i * 0.38;
              const [a, b2] = P(14.2 + 0.35, yy, 0.28, U, v);
              const [c2, e] = P(14.2 + 3.4 - (i ? 0.35 : 1.1), yy, 0.28, U, v);
              return `M${a.toFixed(1)} ${b2.toFixed(1)}L${c2.toFixed(1)} ${e.toFixed(1)}`;
            })
            .join("")}
          stroke="#B9B8B3"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </Slide>
    ),
  });
  for (const [i, b] of [box(13.0, 5.4, 0, 2.0, 1.8, 1.0), box(4.6, 11.4, 0, 0.7, 0.7, 0.7), box(17.6, 5.6, 0, 0.7, 0.7, 1.8), box(10.6, 11.6, 0, 0.8, 0.8, 0.5)].entries())
    items.push({
      id: `p${i}`,
      b,
      el: (v) => (
        <Rise id={`hx-p${i}`} b={b} u={U} at={200 + i * 90} view={v}>
          <Block b={b} u={U} grain={G} view={v} />
        </Rise>
      ),
    });

  // One frame for every angle, so the figure never resizes while it turns.
  const vb = viewBox([DESK, ...items.map((i) => i.b)], U, [140, 380, 30, 380], [0, 45, 90, 135, 180, 225, 270, 315].map((a) => ({ az: a, ...PIVOT })));
  const pos = (x: number, y: number) => ({ left: `${((x - vb.x) / vb.w) * 100}%`, top: `${((y - vb.y) / vb.h) * 100}%` });

  const sorted = depthSort(items, view);
  const hulls = items.map((i) => ({ id: i.id, h: hull(i.b, U, view) }));
  const ys = hulls.flatMap((h) => h.h.map((p) => p[1]));
  // Labels clear the desk's far edge too, so their text never sits on the desk top.
  const top = Math.min(...ys, ...hull(DESK, U, view).map((p) => p[1]));
  const bottom = Math.max(...ys);
  const mid = P(PIVOT.cx, PIVOT.cy, 0, U)[0];
  // Kit rule: leaders never cross a block face. From the anchor go straight up if that is open sky,
  // otherwise straight down past whatever is in front, then a short run toward the middle.
  const hit = (x: number, y: number, own: string) => hulls.some((h) => h.id !== own && inside(h.h, x, y));
  const place = (a: V3, own: string, lift = 0, below?: V3) => {
    const [ax, ay0] = P(a[0], a[1], a[2], U, view);
    let ay = ay0 - lift;
    let up = true;
    for (let y = ay - 4; y > top - lift - 4 && up; y -= 3) up = !hit(ax, y + lift, own);
    if (up) return callout(ax, ay, Math.min(ay - 26, top - lift - 12), mid);
    // Going down, start from the object's foot so the leader does not run back over the object.
    if (below) ay = P(below[0], below[1], below[2], U, view)[1] - lift;
    let low = ay;
    for (let y = ay + 4; y < bottom; y += 3) if (hit(ax, y + lift, own)) low = y;
    const ey = Math.max(ay + 26, low + 14);
    // No room under the desk for the text: go up after all, over the (dimmed) blocks behind.
    if (ey + 100 > vb.y + vb.h) return callout(ax, ay0 - lift, Math.min(ay0 - lift - 26, top - lift - 12), mid);
    return callout(ax, ay, ey, mid);
  };

  // Spec labels. At the kit's own view they keep the kit layout; at the other three quarter views they
  // are placed by the rule above. Turning between views they fade out and back in.
  const quarter = ((snap(az) % 360) + 360) % 360;
  const show = Math.max(0, 1 - Math.abs(az - snap(az)) / 10);
  const live = 1.2; // the live candle sits at the back of the row
  const lb = d.bars[n - 1]!;
  const rejAnchor: V3 = sell ? [CX + CW / 2, live + CW / 2, z(hi)] : [CX + CW, live + CW / 2, z(Math.max(lb[1], lb[4]))];
  type Spot = { ax: number; ay: number; ex: number; ey: number; side: "start" | "end"; up: boolean; d: string };
  let lvl: Spot, rej: Spot;
  if (quarter === 0) {
    lvl = { ...leader([0.6, 11.9, zL + 0.04], U, { dy: -46, col: P(0.6, 12.0, 0, U, view)[0] }, view), up: false };
    // A resistance wick has open sky above it, so its tip carries the label; under a support the row
    // is in the way, so the label hangs off the body's top edge.
    rej = { ...leader(rejAnchor, U, sell ? { dy: -24, col: P(15.2, 0, 0, U, view)[0] } : { dy: -86, col: P(15.2, 0, 0, U, view)[0] }, view), up: false };
  } else {
    const ends = [-0.9, 11.9].flatMap((y) => [0.6, 1.45].map((x): V3 => [x, y, zL + 0.04]));
    const tries = ends.map((e) => place(e, "level"));
    lvl = tries.find((t) => t.up) ?? tries[0]!;
    rej = place(sell ? rejAnchor : [CX + CW / 2, live + CW / 2, z(Math.max(lb[1], lb[4]))], `c${n - 1}`, 0, items.find((i) => i.id === `c${n - 1}`)!.anchor!.slice(0, 2).concat(z(lb[3])) as V3);
    // Two labels at the same height turn away from each other instead of overlapping.
    if (lvl.up === rej.up && Math.abs(lvl.ey - rej.ey) < 120) {
      const out = (c: Spot, side: "start" | "end") => {
        const ex = c.ax + (side === "end" ? -22 : 22);
        return { ...c, side, ex, d: `M${c.ax.toFixed(2)} ${c.ay.toFixed(2)}V${c.ey.toFixed(2)}H${ex.toFixed(2)}` };
      };
      const ey = lvl.up ? Math.min(lvl.ey, rej.ey) : Math.max(lvl.ey, rej.ey);
      lvl = out({ ...lvl, ey }, lvl.ax < rej.ax ? "end" : "start");
      rej = out({ ...rej, ey }, lvl.side === "end" ? "start" : "end");
    }
  }
  const towerL = TOWERS.map(([x, y, h]) => leader(topAnchor(box(x, y, 0, 2.3, 2.3, h), view), U, { dy: -50, dx: 40 }, view));

  const on = active ? items.find((i) => i.id === active) : undefined;
  const tip = on?.info && on.id !== "level" ? place(on.anchor ?? topAnchor(on.b, view), on.id, LIFT, on.anchor && [on.anchor[0], on.anchor[1], on.b[4]]) : null;
  // While one object is inspected the other spec labels step back; the key level keeps its own.
  const hide = (keep?: string) => (active && active !== keep ? "tv-hide" : undefined);
  const labelAt = (c: { side: "start" | "end"; up: boolean }, kit: boolean) =>
    kit ? (c.side === "end" ? "-translate-x-full pr-2" : "pl-2") : cn("tv-callout-label", c.side === "end" ? "items-end pr-2" : "pl-2");
  const tx = (c: { side: "start" | "end"; up: boolean }) => ({ ["--tx" as string]: c.side === "end" ? "-100%" : "0", ["--ty" as string]: c.up ? "calc(-100% + 7px)" : "-7px" });

  const frame = (fn: () => void) => {
    cancelAnimationFrame(par.current);
    par.current = requestAnimationFrame(fn);
  };
  const lean = (x: number, y: number) =>
    frame(() => {
      root.current?.style.setProperty("--px", x.toFixed(3));
      root.current?.style.setProperty("--py", y.toFixed(3));
    });
  // Your level: the price per world unit is the desk's own scale, snapped to the tick, kept on the chart.
  function clampP(p: number) {
    return Math.min(hi, Math.max(lo, Math.round(p / tick) * tick));
  }
  const levelDown = (e: React.PointerEvent<SVGGElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Captured on the scene, not the plate: the plate's node moves in the depth order while it drags.
    root.current?.setPointerCapture(e.pointerId);
    lvlDrag.current = { id: e.pointerId, y: e.clientY, p: lvlP };
  };
  const levelMove = (e: React.PointerEvent) => {
    const g = lvlDrag.current;
    if (!g || g.id !== e.pointerId) return;
    const px = (root.current?.clientWidth ?? vb.w) / vb.w; // screen px per user unit
    const dz = -(e.clientY - g.y) / (px * U);
    setMine(clampP(g.p + (dz * (hi - lo)) / 6));
  };
  const levelUp = (e: React.PointerEvent) => {
    if (lvlDrag.current?.id === e.pointerId) lvlDrag.current = null;
  };

  // The pressure map: floor cells near the pointer ink in, then fade. One rAF loop, only while warm.
  const paintHeat = () => {
    const g = heatLayer.current;
    if (!g) return;
    const v = viewRef.current;
    let out = "";
    for (const [k, h] of heat.current) {
      const nh = h * 0.93;
      if (nh < 0.03) heat.current.delete(k);
      else heat.current.set(k, nh);
      const [i, j] = k.split(",").map(Number) as [number, number];
      const zz = i >= 0 && i < 19 && j >= 0 && j < 13 ? 0 : -0.35;
      out += `<polygon points="${pts([[i, j, zz], [i + 1, j, zz], [i + 1, j + 1, zz], [i, j + 1, zz]], U, v)}" fill-opacity="${(nh * 0.14).toFixed(3)}"/>`;
    }
    g.innerHTML = out;
    heatRaf.current = heat.current.size ? requestAnimationFrame(paintHeat) : 0;
  };
  const warm = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const sx = vb.x + ((e.clientX - r.left) / r.width) * vb.w;
    const sy = vb.y + ((e.clientY - r.top) / r.height) * vb.h;
    // Screen to floor: on the desk top first, the floor below if that point is off the desk.
    const at = (zz: number) => {
      const a = sx / (C * U);
      const b = (sy + zz * U) / (S * U);
      return rot((a + b) / 2, (b - a) / 2, { az: -az, ...PIVOT });
    };
    let [x, y] = at(0);
    if (x < 0 || x > 19 || y < 0 || y > 13) [x, y] = at(-0.35);
    for (let i = Math.floor(x - 2); i <= x + 2; i++)
      for (let j = Math.floor(y - 2); j <= y + 2; j++) {
        const dd = Math.hypot(i + 0.5 - x, j + 0.5 - y);
        if (dd < 1.8) heat.current.set(`${i},${j}`, Math.max(heat.current.get(`${i},${j}`) ?? 0, 1 - dd / 1.8));
      }
    if (!heatRaf.current) heatRaf.current = requestAnimationFrame(paintHeat);
  };

  const fine = () => matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches;
  const perPx = () => 90 / Math.max(180, (root.current?.clientWidth ?? 600) * 0.38);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if ((e.target as Element).closest("button, [data-level]")) return;
    cancelAnimationFrame(tween.current);
    drag.current = { x: e.clientX, az: azRef.current, id: e.pointerId, on: false, last: e.clientX, t: e.timeStamp, v: 0 };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lvlDrag.current) return levelMove(e);
    const g = drag.current;
    if (!g || g.id !== e.pointerId) {
      if (e.pointerType !== "mouse" || !fine()) return;
      const r = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = ((e.clientY - r.top) / r.height) * 2 - 1;
      warm(e);
      return lean(x, y);
    }
    const dx = e.clientX - g.x;
    if (!g.on) {
      if (Math.abs(dx) < 6) return;
      g.on = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.setAttribute("data-dragging", "");
      clear();
      setTouched(true);
    }
    if (e.timeStamp > g.t) g.v = (e.clientX - g.last) / (e.timeStamp - g.t);
    g.last = e.clientX;
    g.t = e.timeStamp;
    if (!reduced()) frame(() => setAz(g.az + dx * perPx()));
  };
  const end = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const g = drag.current;
    if (!g || g.id !== e.pointerId) return;
    drag.current = null;
    if (!g.on) return;
    e.currentTarget.removeAttribute("data-dragging");
    eat.current = true;
    setTimeout(() => (eat.current = false), 0);
    const dx = e.clientX - g.x;
    // Reduced motion: a swipe is a step of one quarter, no tween. Otherwise settle on the nearest
    // quarter the flick is heading for.
    if (reduced()) return turnTo(snap(g.az) + (Math.abs(dx) > 40 ? Math.sign(dx) * 90 : 0));
    cancelAnimationFrame(par.current);
    // A flick carries on to the next quarter at most.
    const fling = cancelled ? 0 : Math.max(-40, Math.min(40, g.v * perPx() * 120));
    turnTo(snap(azRef.current + fling));
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setTouched(true);
    turnTo(goal.current + (e.key === "ArrowRight" ? 90 : -90));
  };

  return (
    <Build immediate className={cn("relative", className)} style={{ aspectRatio: `${vb.w} / ${vb.h}` }}>
      <div
        ref={root}
        className="tv-scene absolute inset-0"
        role="group"
        tabIndex={0}
        aria-label={`${d.sym} desk. Drag, swipe or use the arrow keys to turn it. Tab to inspect each object.`}
        data-inspecting={active ?? undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => (levelUp(e), end(e, false))}
        onPointerCancel={(e) => (levelUp(e), end(e, true))}
        onPointerLeave={(e) => e.pointerType === "mouse" && !drag.current && lean(0, 0)}
        onClickCapture={(e) => {
          if (eat.current) e.stopPropagation();
        }}
        onClick={(e) => !(e.target as Element).closest(".tv-obj") && clear()}
        onKeyDown={onKeyDown}
      >
        <svg viewBox={`${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`} className="tv-par-back absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <defs>
            <GrainDefs id={G} />
          </defs>
          {/* The floor: a faint grid in the same projection, turning with the desk, fading out to the edges. */}
          <radialGradient id="hx-fade-g">
            <stop offset="0.3" stopColor="#fff" />
            <stop offset="0.75" stopColor="#000" />
          </radialGradient>
          <mask id="hx-fade" maskContentUnits="objectBoundingBox">
            <rect width={1} height={1} fill="url(#hx-fade-g)" />
          </mask>
          <path d={grid} mask="url(#hx-fade)" fill="none" stroke="#111214" strokeOpacity={0.08} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
          <Shadow b={DESK} u={U} z={-0.35} off={0.65} view={view} />
          <Block b={DESK} u={U} grain={G} view={view} />
          <g ref={heatLayer} fill="#111214" />
        </svg>
        <div ref={front} className="tv-par-front absolute inset-0">
          <svg viewBox={`${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`} className="absolute inset-0 h-full w-full overflow-visible">
            {sorted.map((it) =>
              it.id === "level" ? (
                <g key={it.id} {...bind(it.id, it.info!)} data-level="" onPointerDown={levelDown}>
                  {it.el(view)}
                </g>
              ) : it.info ? (
                <g key={it.id} {...bind(it.id, it.info)}>
                  {it.el(view)}
                </g>
              ) : (
                <g key={it.id}>{it.el(view)}</g>
              ),
            )}
            <g opacity={show}>
              <g className={hide("level")}>
                <Leader {...lvl} cue={LIVE_AT - 200} />
              </g>
              <g className={hide()}>
                <Leader {...rej} cue={LIVE_AT + 1500} />
              </g>
              {quarter === 0 &&
                towerL.map((t, j) => (
                  <g key={j} className={cn("tv-wide", hide())}>
                    <Leader {...t} cue={900 + j * 120} />
                  </g>
                ))}
            </g>
            {on && ring && (
              <polygon className="tv-ring" points={silhouette([on.b[0] - 0.18, on.b[1] + 0.18, on.b[2] - 0.18, on.b[3] + 0.18, on.b[4] - 0.18, on.b[5] + 0.18], U, view)} transform={`translate(0 ${-LIFT})`} />
            )}
            {tip && <CalloutPath key={active} c={tip} />}
          </svg>

          <p className="sr-only">
            {d.sym} hourly, {d.fmt.time}: price wicked to {d.fmt.extreme} through the key level at {d.fmt.level} and closed back at {d.fmt.close}.
          </p>
          <div className="pointer-events-none absolute inset-0" style={{ opacity: show }}>
          <div data-cue={LIVE_AT - 200} className={cn("tv-label absolute", labelAt(lvl, quarter === 0), hide("level"))} style={{ ...pos(lvl.ex, lvl.ey), ...tx(lvl) }}>
            <span className="tv-label-main">Key level</span>
            <CopyPrice text={`${d.sym} ${lvlText}`} className="tv-label-sub">
              {d.sym} {mine === null ? <Ticker value={d.fmt.level} /> : lvlText}
            </CopyPrice>
            {mine !== null && (
              <span className="tv-label-sub">
                <span className="hidden sm:inline">{crossed.filter(Boolean).length}/{n} wicks through </span>
                <button type="button" className="tv-reset" onClick={() => setMine(null)}>
                  Reset
                </button>
              </span>
            )}
          </div>
          <div data-cue={LIVE_AT + 1500} className={cn("tv-label absolute", labelAt(rej, quarter === 0), hide())} style={{ ...pos(rej.ex, rej.ey), ...tx(rej) }}>
            <span className="tv-label-main">Rejection H1</span>
            <span className="tv-label-sub">
              {sell ? "High" : "Low"} <Ticker value={d.fmt.extreme} />
            </span>
          </div>
          {d.towers.map((t, j) => (
            <div key={t.sym} data-cue={900 + j * 120} className={cn("tv-label tv-wide absolute pl-2", (hide() || quarter !== 0) && "tv-hide")} style={pos(towerL[j]!.ex, towerL[j]!.ey)}>
              <span className="tv-label-main">{t.sym}</span>
              <span className="tv-label-sub">
                <Ticker value={t.val} />
              </span>
            </div>
          ))}
          </div>
          {tip && on?.info && <CalloutLabel key={active} c={tip} info={on.info} {...pos(tip.ex, tip.ey)} />}
        </div>
        <p className={cn("tv-hint", touched && "tv-hint-off")} aria-hidden>
          Drag to turn
        </p>
      </div>
    </Build>
  );
}
