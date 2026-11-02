import { cn } from "@/lib/cn";
import { P, box, depthSort, ellipse, leader, viewBox, type B, type V3 } from "@/features/marketing/lib/iso";
import { Block, Cylinder, GrainDefs, Leader, Rise, Shadow, Slide, flat, type Face } from "./Iso";
import { Build } from "./Build";
import { Ticker } from "./Ticker";

/*
 * The section objects of the scroll story, drawn in code with the kit's projection so they can
 * build as they arrive (a candle extrudes, a plate slides in, a tower rises) and carry real numbers.
 * Each one is its own scene with exactly one Signal accent.
 */

type Item = { b: B; el: (k: number) => React.ReactNode };
type Label = { anchor: V3; main: string; sub?: string; price?: string; dy?: number; dx?: number; col?: number; cue: number; className?: string };

function Figure({ id, u, items, floor, labels, pad, className }: { id: string; u: number; items: Item[]; floor: B[]; labels: Label[]; pad: [number, number, number, number]; className?: string }) {
  const g = `tvg-${id}`;
  const vb = viewBox(items.map((i) => i.b), u, pad);
  const pos = (x: number, y: number) => ({ left: `${((x - vb.x) / vb.w) * 100}%`, top: `${((y - vb.y) / vb.h) * 100}%` });
  const ls = labels.map((l) => ({ ...l, ...leader(l.anchor, u, { dy: l.dy, dx: l.dx, col: l.col }) }));
  return (
    <Build className={cn("relative", className)} style={{ aspectRatio: `${vb.w} / ${vb.h}` }}>
      <svg viewBox={`${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <defs>
          <GrainDefs id={g} />
        </defs>
        {floor.map((b, i) => (
          <Shadow key={i} b={b} u={u} />
        ))}
        {depthSort(items).map((it, k) => it.el(k))}
        {ls.map((l, i) => (
          <g key={i} className={l.className}>
            <Leader d={l.d} ax={l.ax} ay={l.ay} cue={l.cue} />
          </g>
        ))}
      </svg>
      {ls.map((l, i) => (
        <div key={i} data-cue={l.cue} className={cn("tv-label absolute", l.side === "end" ? "-translate-x-full pr-2" : "pl-2", l.className)} style={pos(l.ex, l.ey)}>
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

/** Three candles: up in white, down in graphite, the live one in Signal, extruding one by one. */
export function CandlesFigure({ high, sym, className }: { high: string; sym: string; className?: string }) {
  const u = 34;
  const rows: [number, number, number, number, Face][] = [
    [0.9, 2.1, 2.5, 0.4, "white"],
    [2.1, 1.4, 2.6, 1.0, "graphite"],
    [1.4, 3.3, 3.8, 1.2, "signal"],
  ];
  const items: Item[] = [];
  const floor: B[] = [];
  const base = box(-0.3, -0.2, 0, 1.6, 4.8, 0.2);
  floor.push(base);
  items.push({ b: base, el: (k) => <Block key={k} b={base} u={u} grain={grain("candles")} /> });
  rows.forEach(([o, c, h, l, face], i) => {
    const y = 3.2 - i * 1.5;
    const lo = Math.min(o, c) + 0.2;
    const hi = Math.max(o, c) + 0.2;
    const body = box(0, y, lo, 1, 1, hi - lo);
    const all: B = [0, 1, y, y + 1, l + 0.2, h + 0.2];
    const wick = (z0: number, z1: number) => box(0.42, y + 0.42, z0, 0.16, 0.16, z1 - z0);
    items.push({
      b: all,
      el: (k) => (
        <Rise key={k} id={`cf-${i}`} b={all} u={u} from={0.2} at={i * 160}>
          <Block b={wick(l + 0.2, lo)} u={u} face="ink" />
          <Block b={body} u={u} face={face} grain={grain("candles")} />
          <Block b={wick(hi, h + 0.2)} u={u} face="ink" />
        </Rise>
      ),
    });
  });
  return (
    <Figure
      id="candles"
      u={u}
      items={items}
      floor={floor}
      pad={[50, 170, 20, 20]}
      className={className}
      labels={[{ anchor: [0.5, 0.2 + 0.5, 4.0], main: "Live candle", sub: `${sym} high`, price: high, dy: -22, dx: 70, cue: 900 }]}
    />
  );
}

/** A closed journal slab with its bookmark ribbon: the one accent. Slides onto the desk. */
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
export function ClockFigure({ hour, arcs, className }: { hour: number | null; arcs: { name: string; from: number; to: number; open: boolean }[]; className?: string }) {
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
                return <polyline key={a.name} points={flat(ps, h, u)} strokeWidth={j === lit ? 4 : 1.3} stroke={j === lit ? "#FFD400" : "#111214"} />;
              })}
              {hour !== null && <polyline points={flat([[0, 0], at(r * 0.78, hour)], h, u)} strokeWidth={1.8} />}
            </g>
          </Cylinder>
        </Slide>
      ),
    },
  ];
  return <Figure id="clock" u={u} items={items} floor={[]} pad={[30, 30, 30, 30]} className={className} labels={[]} />;
}
