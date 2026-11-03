"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { P, box, depthSort, ellipse, hull, leader, pts, silhouette, viewBox, type B, type V3 } from "@/features/marketing/lib/iso";
import { Block, Cylinder, GrainDefs, Leader, Rise, Shadow, Slide, flat } from "./Iso";
import { Build } from "./Build";
import { Ticker } from "./Ticker";
import { CalloutLabel, CalloutPath, callout, inside, useInspect, type Info } from "./Inspect";

/*
 * The section objects of the scroll story, drawn in code with the kit's projection so they can
 * build as they arrive (a candle extrudes, a plate slides in, a tower rises) and carry real numbers.
 * Each one is its own scene with exactly one Signal accent.
 */

export type Item = { id?: string; b: B; el: (k: number) => React.ReactNode; info?: Info; anchor?: V3 };
const LIFT = 7;
export type Label = { anchor: V3; main: string; sub?: string; lines?: string[]; strikes?: string[]; note?: string[]; price?: string; strike?: boolean; dy?: number; dx?: number; col?: number; cue: number; className?: string };

/**
 * One isometric scene: blocks depth sorted, built on scroll, plain spec labels on straight
 * leaders, and inspect (hover, tap, focus) on every item that carries `info`. `under` and
 * `over` are extra SVG layers (a floor grid, a stamp) in the same user units. Pass `inspect`
 * to share the active object with something outside the drawing (a parts list).
 */
export function Figure({
  id,
  u,
  items,
  floor,
  labels,
  pad,
  className,
  inspect,
  under,
  over,
  bounds = [],
  tip: showTip = true,
  maxH,
  quiet = true,
}: {
  id: string;
  u: number;
  items: Item[];
  floor: B[];
  labels: Label[];
  pad: [number, number, number, number];
  className?: string;
  inspect?: ReturnType<typeof useInspect>;
  under?: React.ReactNode;
  over?: React.ReactNode;
  /** Extra boxes the frame must hold (a floor grid, a falling slab). */
  bounds?: B[];
  /** Draw the inspect callout; off when the object's text shows somewhere else. */
  tip?: boolean;
  /** Cap the drawing at this share of the viewport height (svh), width following. */
  maxH?: number;
  /** Spec labels step back while an object is inspected. */
  quiet?: boolean;
}) {
  const g = `tvg-${id}`;
  const own = useInspect();
  const { active, ring, bind, clear } = inspect ?? own;
  const vb = viewBox([...items.map((i) => i.b), ...bounds], u, pad);
  const pos = (x: number, y: number) => ({ left: `${((x - vb.x) / vb.w) * 100}%`, top: `${((y - vb.y) / vb.h) * 100}%` });
  const ls = labels.map((l) => ({ ...l, ...leader(l.anchor, u, { dy: l.dy, dx: l.dx, col: l.col }) }));
  const keyed = items.map((it, i) => ({ ...it, key: it.id ?? `${id}-${i}` }));
  const on = keyed.find((i) => i.key === active);
  // The callout goes straight up from the object to just above the figure, then toward the middle.
  const top = Math.min(...items.flatMap((i) => hull(i.b, u).map((p) => p[1])));
  const tip =
    showTip &&
    on?.info &&
    (() => {
      const b = on.b;
      const a = on.anchor ?? [b[0] + (b[1] - b[0]) * 0.3, b[2] + (b[3] - b[2]) * 0.3, b[5]];
      const [ax, ay] = P(a[0], a[1], a[2], u);
      // Straight up unless another block is in the way (kit rule: leaders never cross a face), then down.
      const hs = keyed.filter((i) => i !== on && i.info).map((i) => hull(i.b, u));
      let up = true;
      for (let y = ay - 4; y > top && up; y -= 3) up = !hs.some((h) => inside(h, ax, y));
      const down = Math.max(...hs.flatMap((h) => h.map((p) => p[1])), ay) + 16;
      if (!up && down + 40 < vb.y + vb.h) return callout(ax, ay - LIFT, down, vb.x + vb.w / 2);
      return callout(ax, ay - LIFT, Math.min(ay - LIFT - 26, top - LIFT - 12), vb.x + vb.w / 2);
    })();
  return (
    <Build className={cn("relative", className)} style={{ aspectRatio: `${vb.w} / ${vb.h}`, maxWidth: maxH ? `min(100%, ${((maxH * vb.w) / vb.h).toFixed(1)}svh)` : undefined }}>
      <div className="absolute inset-0" data-inspecting={active ?? undefined} onClick={(e) => !(e.target as Element).closest(".tv-obj") && clear()}>
        <svg viewBox={`${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`} className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <GrainDefs id={g} />
          </defs>
          {under}
          {floor.map((b, i) => (
            <Shadow key={i} b={b} u={u} />
          ))}
          {depthSort(keyed).map((it, k) =>
            it.info ? (
              <g key={it.key} {...bind(it.key, it.info)}>
                {it.el(k)}
              </g>
            ) : (
              <g key={it.key}>{it.el(k)}</g>
            ),
          )}
          {over}
          {ls.map((l, i) => (
            <g key={i} className={cn(l.className, quiet && active && "tv-hide")}>
              <Leader d={l.d} ax={l.ax} ay={l.ay} cue={l.cue} />
            </g>
          ))}
          {on && ring && (
            <polygon className="tv-ring" points={silhouette([on.b[0] - 0.15, on.b[1] + 0.15, on.b[2] - 0.15, on.b[3] + 0.15, on.b[4] - 0.15, on.b[5] + 0.15], u)} transform={`translate(0 ${-LIFT})`} />
          )}
          {tip && <CalloutPath key={active} c={tip} />}
        </svg>
        {ls.map((l, i) => (
          <div key={i} data-cue={l.cue} className={cn("tv-label absolute", l.side === "end" ? "-translate-x-full pr-2" : "pl-2", l.className, quiet && active && "tv-hide")} style={pos(l.ex, l.ey)}>
            <span className={cn("tv-label-main", l.strike && "tv-strike")}>{l.main}</span>
            {(l.sub || l.price) && (
              <span className="tv-label-sub">
                {l.sub}
                {l.sub && l.price ? " " : ""}
                {l.price && <Ticker value={l.price} />}
              </span>
            )}
            {l.lines?.map((x) => (
              <span key={x} className="tv-label-sub">
                {x}
              </span>
            ))}
            {l.strikes?.map((x) => (
              <span key={x} className="tv-label-sub tv-strike">
                {x}
              </span>
            ))}
            {l.note && (
              <span className="tv-note">
                {l.note.map((x) => (
                  <span key={x}>{x}</span>
                ))}
              </span>
            )}
          </div>
        ))}
        {tip && on?.info && <CalloutLabel key={active} c={tip} info={on.info} {...pos(tip.ex, tip.ey)} />}
      </div>
    </Build>
  );
}

const grain = (id: string) => `tvg-${id}`;

/**
 * Where's the Discord: a chat server on the desk with its plug pulled. A speech bubble with two eyes
 * on the top face reads as "the server" without copying anyone's mark; the loose plug is the one Signal.
 */
export function DiscordFigure({ className }: { className?: string }) {
  const u = 36;
  const server = box(0, 0, 0, 2.6, 2.0, 2.2);
  const plug = box(3.6, 3.15, 0, 0.9, 0.5, 0.42);
  const socket = box(5.0, 2.95, 0, 0.55, 0.9, 0.42);
  const top = server[5];
  // Click the plug: it goes in, the server's light comes on, then it pulls itself back out. Nope.
  const [st, setSt] = useState<"idle" | "in" | "lit" | "nope">("idle");
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const press = () => {
    if (st !== "idle") return;
    setSt("in");
    timers.current = ([[260, "lit"], [1500, "nope"], [3400, "idle"]] as const).map(([ms, s]) => window.setTimeout(() => setSt(s), ms));
  };
  const say = st === "lit" ? ["Server online", "For about a second"] : st === "nope" ? ["Nope.", "Unplugged on purpose"] : ["Server offline", "Unplugged on purpose"];
  const [px, py] = P(st === "in" || st === "lit" ? 0.38 : 0, 0, 0, u);
  const bubble = flat([[0.45, 0.45], [2.15, 0.45], [2.15, 1.3], [1.0, 1.3], [0.7, 1.62], [0.72, 1.3], [0.45, 1.3]], top, u);
  const cable = [[1.3, 2.0], [1.3, 3.4], [3.6, 3.4]].map(([x, y]) => P(x, y, 0.05, u).map((n) => n.toFixed(1)).join(",")).join(" ");
  const led = pts([[2.6, 0.35, 1.72], [2.6, 1.05, 1.72], [2.6, 1.05, 1.86], [2.6, 0.35, 1.86]], u); // a light on the server's front
  const prongs = [3.3, 3.5]
    .map((y) => {
      const [a, b] = P(4.5, y, 0.2, u);
      const [c, d] = P(4.85, y, 0.2, u);
      return `M${a.toFixed(1)} ${b.toFixed(1)}L${c.toFixed(1)} ${d.toFixed(1)}`;
    })
    .join("");
  const items: Item[] = [
    {
      b: server,
      info: { main: "Chat server", lines: [st === "lit" ? "Online, briefly" : "Offline, on purpose"], aria: "Chat server, offline on purpose" },
      el: (k) => (
        <Rise key={k} id="tv-discord-rise" b={server} u={u} from={0}>
          <Block b={server} u={u} grain={grain("discord")} />
          <polygon points={bubble} fill="#111214" />
          <ellipse {...ellipse(1.05, 0.88, top, 0.13, u)} fill="#F4F3EF" />
          <ellipse {...ellipse(1.6, 0.88, top, 0.13, u)} fill="#F4F3EF" />
          <polygon points={led} className="tv-led" fill={st === "lit" ? "#FFD400" : "#3A3C40"} />
        </Rise>
      ),
    },
    {
      b: [1.2, 4.85, 2.0, 3.65, 0, 0.42],
      anchor: [4.05, 3.4, 0.42],
      info: { main: say[0]!, lines: [say[1]!], aria: "Plug the chat server in", onPress: press },
      el: (k) => (
        <g key={k}>
          <polyline points={cable} fill="none" stroke="#111214" strokeWidth={1.6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <Slide v={[-1.4, 0, 0]} u={u} at={350}>
            <g className="tv-plug" style={{ transform: `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)` }}>
              <path d={prongs} stroke="#111214" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
              <Block b={plug} u={u} face="signal" />
            </g>
          </Slide>
        </g>
      ),
    },
    { b: socket, el: (k) => <Block key={k} b={socket} u={u} face="graphite" grain={grain("discord")} /> },
  ];
  return (
    <Figure
      id="discord"
      u={u}
      items={items}
      floor={[server, plug, socket]}
      pad={[40, 190, 90, 40]}
      className={className}
      labels={[{ anchor: [4.05, 3.4, 0.42], main: say[0]!, sub: say[1], dy: 46, dx: 70, cue: 900 }]}
    />
  );
}

/**
 * The session clock, live: a 24 h WIB dial with the three sessions as arcs, the hand on the
 * current WIB time. The session that is open now is the one Signal arc.
 */
export function ClockFigure({ hour, arcs, className, litColor = "#FFD400" }: { hour: number | null; arcs: { name: string; from: number; to: number; open: boolean }[]; className?: string; litColor?: string }) {
  const u = 38;
  const r = 2.6;
  const h = 0.55;
  const at = (rr: number, t: number): [number, number] => [rr * Math.cos((2 * Math.PI * (t - 6)) / 24), rr * Math.sin((2 * Math.PI * (t - 6)) / 24)];
  const lit = arcs.findIndex((a) => a.open);
  const b: B = [-r, r, -r, r, 0, h];
  const items: Item[] = [
    {
      b,
      el: (k) => (
        <Slide key={k} v={[0, 0, 1.4]} u={u}>
          <ellipse {...ellipse(0.35, 0.35, 0, r, u)} fill="#E4E3DE" />
          <Cylinder cx={0} cy={0} z={0} r={r} h={h} u={u}>
            <g fill="none" stroke="#111214" vectorEffect="non-scaling-stroke">
              {Array.from({ length: 24 }, (_, i) => (
                <polyline key={i} points={flat([at(r * (i % 6 ? 0.88 : 0.8), i), at(r * 0.95, i)], h, u)} strokeWidth={i % 6 ? 0.7 : 1.1} />
              ))}
              {arcs.map((a, j) => {
                const to = a.to <= a.from ? a.to + 24 : a.to;
                const ps = Array.from({ length: 41 }, (_, q) => at(r * (0.7 - j * 0.11), a.from + ((to - a.from) * q) / 40));
                return <polyline key={a.name} points={flat(ps, h, u)} strokeWidth={j === lit ? 4 : 1.3} stroke={j === lit ? litColor : "#111214"} />;
              })}
              {hour !== null && <polyline points={flat([[0, 0], at(r * 0.78, hour)], h, u)} strokeWidth={1.8} />}
            </g>
          </Cylinder>
        </Slide>
      ),
    },
  ];
  const open = arcs.filter((a) => a.open).map((a) => a.name);
  const hh = hour === null ? "" : `${String(Math.floor(hour)).padStart(2, "0")}:${String(Math.floor((hour % 1) * 60)).padStart(2, "0")} WIB`;
  items[0]!.anchor = [0, 0, h];
  items[0]!.info = {
    main: "Session clock",
    lines: [hh, open.length ? `${open.join(" + ")} open` : "All sessions shut"].filter(Boolean),
    aria: `Session clock${hh ? ` at ${hh}` : ""}: ${open.length ? `${open.join(" and ")} open` : "all sessions shut"}`,
  };
  return <Figure id="clock" u={u} items={items} floor={[]} pad={[30, 30, 30, 30]} className={className} labels={[]} />;
}
