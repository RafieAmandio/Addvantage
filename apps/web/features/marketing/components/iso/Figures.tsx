"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { Bar, BarText } from "@/features/marketing/lib/landing";
import { P, box, depthSort, ellipse, hull, leader, pts, silhouette, viewBox, type B, type V3 } from "@/features/marketing/lib/iso";
import { Block, Cylinder, GrainDefs, Leader, Rise, Shadow, Slide, flat, type Face } from "./Iso";
import { Build } from "./Build";
import { Ticker } from "./Ticker";
import { CalloutLabel, CalloutPath, callout, inside, useInspect, type Info } from "./Inspect";

/*
 * The section objects of the scroll story, drawn in code with the kit's projection so they can
 * build as they arrive (a candle extrudes, a plate slides in, a tower rises) and carry real numbers.
 * Each one is its own scene with exactly one Signal accent.
 */

type Item = { b: B; el: (k: number) => React.ReactNode; info?: Info; anchor?: V3 };
const LIFT = 7;
type Label = { anchor: V3; main: string; sub?: string; price?: string; dy?: number; dx?: number; col?: number; cue: number; className?: string };

function Figure({ id, u, items, floor, labels, pad, className }: { id: string; u: number; items: Item[]; floor: B[]; labels: Label[]; pad: [number, number, number, number]; className?: string }) {
  const g = `tvg-${id}`;
  const { active, ring, bind, clear } = useInspect();
  const vb = viewBox(items.map((i) => i.b), u, pad);
  const pos = (x: number, y: number) => ({ left: `${((x - vb.x) / vb.w) * 100}%`, top: `${((y - vb.y) / vb.h) * 100}%` });
  const ls = labels.map((l) => ({ ...l, ...leader(l.anchor, u, { dy: l.dy, dx: l.dx, col: l.col }) }));
  const keyed = items.map((it, i) => ({ ...it, key: `${id}-${i}` }));
  const on = keyed.find((i) => i.key === active);
  // The callout goes straight up from the object to just above the figure, then toward the middle.
  const top = Math.min(...items.flatMap((i) => hull(i.b, u).map((p) => p[1])));
  const tip =
    on?.info &&
    (() => {
      const b = on.b;
      const a = on.anchor ?? [b[0] + (b[1] - b[0]) * 0.3, b[2] + (b[3] - b[2]) * 0.3, b[5]];
      const [ax, ay] = P(a[0], a[1], a[2], u);
      // Straight up unless another block is in the way (kit rule: leaders never cross a face), then down.
      const hs = keyed.filter((i) => i !== on).map((i) => hull(i.b, u));
      let up = true;
      for (let y = ay - 4; y > top && up; y -= 3) up = !hs.some((h) => inside(h, ax, y));
      const down = Math.max(...hs.flatMap((h) => h.map((p) => p[1])), ay) + 16;
      if (!up && down + 40 < vb.y + vb.h) return callout(ax, ay - LIFT, down, vb.x + vb.w / 2);
      return callout(ax, ay - LIFT, Math.min(ay - LIFT - 26, top - LIFT - 12), vb.x + vb.w / 2);
    })();
  return (
    <Build className={cn("relative", className)} style={{ aspectRatio: `${vb.w} / ${vb.h}` }}>
      <div className="absolute inset-0" data-inspecting={active ?? undefined} onClick={(e) => !(e.target as Element).closest(".tv-obj") && clear()}>
        <svg viewBox={`${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`} className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <GrainDefs id={g} />
          </defs>
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
          {ls.map((l, i) => (
            <g key={i} className={cn(l.className, active && "tv-hide")}>
              <Leader d={l.d} ax={l.ax} ay={l.ay} cue={l.cue} />
            </g>
          ))}
          {on && ring && (
            <polygon className="tv-ring" points={silhouette([on.b[0] - 0.15, on.b[1] + 0.15, on.b[2] - 0.15, on.b[3] + 0.15, on.b[4] - 0.15, on.b[5] + 0.15], u)} transform={`translate(0 ${-LIFT})`} />
          )}
          {tip && <CalloutPath key={active} c={tip} />}
        </svg>
        {ls.map((l, i) => (
          <div key={i} data-cue={l.cue} className={cn("tv-label absolute", l.side === "end" ? "-translate-x-full pr-2" : "pl-2", l.className, active && "tv-hide")} style={pos(l.ex, l.ey)}>
            <span className="tv-label-main">{l.main}</span>
            {(l.sub || l.price) && (
              <span className="tv-label-sub">
                {l.sub}
                {l.sub && l.price ? " " : ""}
                {l.price && <Ticker value={l.price} />}
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

/** Instrument towers, one per market, height by how far it moved; the one that moved most is Signal. */
export function TowersFigure({ markets, className }: { markets: { sym: string; val: string; chg: string }[]; className?: string }) {
  const u = 30;
  // The six biggest movers, in board order, prices without separators.
  const by = (m: { chg: string }) => Math.abs(parseFloat(m.chg));
  const keep = new Set([...markets].sort((a, b) => by(b) - by(a)).slice(0, 6));
  const ms = markets.filter((m) => keep.has(m)).map((m) => ({ ...m, val: m.val.replace(/,/g, "") }));
  const mag = ms.map((m) => Math.abs(parseFloat(m.chg)));
  const top = mag.indexOf(Math.max(...mag));
  const max = Math.max(...mag) || 1;
  const items: Item[] = [];
  const floor: B[] = [];
  const spots: [number, number][] = [[0, 0], [2.9, 0], [5.8, 0], [0, 2.9], [2.9, 2.9], [5.8, 2.9]];
  ms.forEach((m, i) => {
    const [x, y] = spots[i]!;
    const b = box(x, y, 0, 2.1, 2.1, 0.8 + (mag[i]! / max) * 4.6);
    floor.push(b);
    items.push({
      b,
      info: { main: `${m.sym} ${m.chg}`, lines: [`Last ${m.val}`], aria: `${m.sym} last close ${m.val}, ${m.chg} on the day` },
      el: (k) => (
        <Rise key={k} id={`tw-${i}`} b={b} u={u} at={i * 90}>
          <Block b={b} u={u} face={i === top ? "signal" : "white"} grain={grain("towers")} />
        </Rise>
      ),
    });
  });
  const t = ms[top]!;
  const [tx, ty] = spots[top]!;
  const tb = items[top]!.b;
  const colR = P(9.4, 0, 0, u)[0];
  return (
    <Figure
      id="towers"
      u={u}
      items={items}
      floor={floor}
      pad={[60, 150, 30, 30]}
      className={className}
      labels={[{ anchor: [tx + 1.05, ty + 1.05, tb[5]], main: `${t.sym} ${t.chg}`, sub: "Last", price: t.val, dy: -34, col: colR, cue: 900 }]}
    />
  );
}

/** The last three real hourly candles: up in white, down in graphite, the live one in Signal, extruding one by one. */
export function CandlesFigure({ bars, text, high, sym, className }: { bars: Bar[]; text: BarText[]; high: string; sym: string; className?: string }) {
  const u = 34;
  const lo = Math.min(...bars.map((r) => r[3]));
  const hi = Math.max(...bars.map((r) => r[2]));
  const z = (p: number) => 0.4 + ((p - lo) / (hi - lo || 1)) * 3.4;
  const items: Item[] = [];
  const floor: B[] = [];
  const base = box(-0.3, -0.2, 0, 1.6, 4.8, 0.2);
  floor.push(base);
  items.push({ b: base, el: (k) => <Block key={k} b={base} u={u} grain={grain("candles")} /> });
  bars.forEach(([, o, h, l, c], i) => {
    const live = i === bars.length - 1;
    const face: Face = live ? "signal" : c >= o ? "white" : "graphite";
    const y = 3.2 - i * 1.5;
    const lo2 = z(Math.min(o, c)) + 0.2;
    const hi2 = Math.max(z(Math.max(o, c)) + 0.2, lo2 + 0.06);
    const body = box(0, y, lo2, 1, 1, hi2 - lo2);
    const all: B = [0, 1, y, y + 1, z(l) + 0.2, Math.max(z(h) + 0.2, hi2)];
    const wick = (z0: number, z1: number) => box(0.42, y + 0.42, z0, 0.16, 0.16, z1 - z0);
    const t = text[i]!;
    items.push({
      b: all,
      anchor: [0.5, y + 0.5, all[5]],
      info: { main: `${sym} ${t.time}`, lines: [`O ${t.o}\u2002H ${t.h}`, `L ${t.l}\u2002C ${t.c}`], aria: `${sym} candle ${t.time}: open ${t.o}, high ${t.h}, low ${t.l}, close ${t.c}` },
      el: (k) => (
        <Rise key={k} id={`cf-${i}`} b={all} u={u} from={0.2} at={i * 160}>
          {all[4] < lo2 && <Block b={wick(all[4], lo2)} u={u} face="ink" />}
          <Block b={body} u={u} face={face} grain={grain("candles")} />
          {all[5] > hi2 && <Block b={wick(hi2, all[5])} u={u} face="ink" />}
        </Rise>
      ),
    });
  });
  const lb = items.at(-1)!.b;
  return (
    <Figure
      id="candles"
      u={u}
      items={items}
      floor={floor}
      pad={[50, 170, 20, 20]}
      className={className}
      labels={[{ anchor: [0.5, lb[2] + 0.5, lb[5]], main: "Live candle", sub: `${sym} high`, price: high, dy: -22, dx: 70, cue: 900 }]}
    />
  );
}

/** A closed journal slab with its bookmark ribbon: the one accent. Slides onto the desk. */
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

export function JournalFigure({ className }: { className?: string }) {
  const u = 36;
  const slab = box(0, 0, 0, 5.6, 3.8, 0.42);
  const ribbon = box(3.4, 3.8, 0.12, 0.5, 0.9, 0.2);
  const lines = [0, 1, 2, 3, 4]
    .map((i) => {
      const yy = 0.6 + i * 0.55;
      const [a, b] = P(0.5, yy, 0.42, u);
      const [c, d] = P(5.6 - (i ? 0.5 : 2.2), yy, 0.42, u);
      return `M${a.toFixed(1)} ${b.toFixed(1)}L${c.toFixed(1)} ${d.toFixed(1)}`;
    })
    .join("");
  const items: Item[] = [
    {
      b: [0, 5.6, 0, 4.7, 0, 0.43],
      el: (k) => (
        <Slide key={k} v={[0, -2.2, 0]} u={u}>
          <Block b={slab} u={u} grain={grain("journal")} />
          <path d={lines} stroke="#B9B8B3" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <polygon points={flat([[3.4, 0], [3.9, 0], [3.9, 3.8], [3.4, 3.8]], 0.43, u)} fill="#FFD400" stroke="#111214" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
          <Block b={ribbon} u={u} face="signal" />
        </Slide>
      ),
    },
  ];
  return (
    <Figure
      id="journal"
      u={u}
      items={items}
      floor={[slab]}
      pad={[30, 40, 70, 150]}
      className={className}
      labels={[{ anchor: [1.6, 3.8, 0.2], main: "1v1 only", sub: "No room, no feed", dy: 40, dx: -50, cue: 800 }]}
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
