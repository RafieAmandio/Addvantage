"use client";

import { cn } from "@/lib/cn";
import { P, box, ellipse, type B } from "@/features/marketing/lib/iso";
import { Figure, type Item } from "@/features/marketing/components/iso/Figures";
import { Block, Rise, Slide, flat } from "@/features/marketing/components/iso/Iso";

const INK = "#111214";
const hair = { stroke: INK, strokeWidth: 0.9, strokeLinejoin: "round" as const, vectorEffect: "non-scaling-stroke" as const };

// World units: the table runs along x, five chairs a side along y.
const L = 8;
const D = 2.2;
const TOP = 1.0;
const SEATS_X = [0.8, 2.4, 4.0, 5.6, 7.2];
const YOURS = 2; // the middle chair on the near side carries the one Signal
const BACK = 1.3; // backrest height: low enough that the near side doesn't hide the table edge

/** A paper glass: white body, ellipse rim, hairline sides. */
function Glass({ x, y, u }: { x: number; y: number; u: number }) {
  const r = 0.09;
  const h = 0.32;
  const t = ellipse(x, y, TOP + h, r, u);
  const [, by] = P(x, y, TOP, u);
  const body = `M${t.cx - t.rx} ${t.cy}L${t.cx - t.rx} ${by}A${t.rx} ${t.ry} 0 0 0 ${t.cx + t.rx} ${by}L${t.cx + t.rx} ${t.cy}Z`;
  return (
    <g>
      <path d={body} fill="#FFFFFF" {...hair} />
      <ellipse cx={t.cx} cy={t.cy} rx={t.rx} ry={t.ry} fill="#EDECE8" {...hair} />
    </g>
  );
}

/** A plate: two concentric rings flat on the table. */
function Plate({ x, y, u }: { x: number; y: number; u: number }) {
  const a = ellipse(x, y, TOP, 0.32, u);
  const b = ellipse(x, y, TOP, 0.2, u);
  return (
    <g>
      <ellipse cx={a.cx} cy={a.cy} rx={a.rx} ry={a.ry} fill="#FFFFFF" {...hair} />
      <ellipse cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill="none" {...hair} />
    </g>
  );
}

function chair(x: number, near: boolean, k: number, u: number, yours: boolean, fid: string, signal: boolean): Item {
  const y0 = near ? D + 0.25 : -1.05;
  const seat = box(x - 0.4, y0, 0, 0.8, 0.8, 0.5);
  // The backrest sits on the side away from the table.
  const back = near ? box(x - 0.4, y0 + 0.66, 0, 0.8, 0.14, BACK) : box(x - 0.4, y0, 0, 0.8, 0.14, BACK);
  const b: B = [seat[0], seat[1], seat[2], seat[3], 0, BACK];
  // The highlighted chair is the Signal unless the screen already spends its yellow elsewhere.
  const face = yours ? (signal ? "signal" : "graphite") : "white";
  const parts = near ? [seat, back] : [back, seat]; // far part first
  const n = near ? 6 + SEATS_X.indexOf(x) : 1 + SEATS_X.indexOf(x);
  return {
    id: `${fid}-chair-${near ? "n" : "f"}${x}`,
    b,
    anchor: [x, y0 + 0.4, 0.5],
    info: yours
      ? { main: "Your seat?", lines: ["By invitation"], aria: "Your seat, by invitation" }
      : { main: `Seat ${String(n).padStart(2, "0")}`, lines: ["By invitation"], aria: `Seat ${n} of 10` },
    el: (key) => (
      <Slide key={key} v={[0, 0, 1.4]} u={u} at={420 + k * 70}>
        {parts.map((p, i) => (
          <Block key={i} b={p} u={u} face={face} grain={`tvg-${fid}`} />
        ))}
      </Slide>
    ),
  };
}

/**
 * The BingX dinner as a small card: the iso table as a thumbnail (it builds in the landing's
 * way, table first, then the chairs drop in; hover, tap or focus lifts a chair) and the facts
 * beside it. `signal` off turns the highlighted chair graphite where the screen's one yellow
 * is already taken (the plan step's chosen Full marker).
 */
export function DinnerCard({ id, signal = true, className }: { id: string; signal?: boolean; className?: string }) {
  const u = 30;
  const fid = `bf-dinner-${id}`;
  const table = box(0, 0, 0, L, D, TOP);
  const slab = box(0, 0, TOP - 0.16, L, D, 0.16);
  const legs = [
    [0.15, 0.15],
    [L - 0.35, 0.15],
    [0.15, D - 0.35],
    [L - 0.35, D - 0.35],
  ].map(([x, y]) => box(x!, y!, 0, 0.2, 0.2, TOP - 0.16));
  // Runner down the middle, and a tent card at the head.
  const runner = flat([[0.35, 0.95], [L - 0.35, 0.95], [L - 0.35, 1.25], [0.35, 1.25]], TOP, u);
  const card = box(0.2, 0.85, TOP, 0.28, 0.5, 0.22);

  const items: Item[] = [
    {
      id: `${fid}-table`,
      b: table,
      el: (key) => (
        <Rise key={key} id={`${fid}-rise`} b={table} u={u} from={0} at={0}>
          {legs.map((l, i) => (
            <Block key={i} b={l} u={u} grain={`tvg-${fid}`} />
          ))}
          <Block b={slab} u={u} grain={`tvg-${fid}`} />
          <polygon points={runner} fill="#EDECE8" {...hair} />
          {SEATS_X.map((x) => (
            <g key={x}>
              <Plate x={x} y={0.48} u={u} />
              <Plate x={x} y={D - 0.48} u={u} />
              <Glass x={x + 0.42} y={0.78} u={u} />
              <Glass x={x - 0.42} y={D - 0.78} u={u} />
            </g>
          ))}
          <Block b={card} u={u} grain={`tvg-${fid}`} />
        </Rise>
      ),
    },
    ...SEATS_X.map((x, i) => chair(x, false, i, u, false, fid, signal)),
    ...SEATS_X.map((x, i) => chair(x, true, i + 5, u, i === YOURS, fid, signal)),
  ];

  return (
    <figure className={cn("flex w-full items-center gap-4 rounded-[10px] border border-tv-stone p-3 md:max-w-[340px]", className)}>
      {/* The table is too small here for callouts; hover still lifts a chair. */}
      <Figure id={fid} u={u} items={items} floor={[table]} labels={[]} tip={false} pad={[14, 14, 14, 14]} className="w-[132px] shrink-0 sm:w-[150px]" />
      <figcaption className="flex flex-col gap-1 font-mono text-[11px] font-medium uppercase leading-[1.3] tracking-[0.08em] text-tv-mute">
        <span className="text-[12px] text-tv-ink">BingX dinner</span>
        <span>10 seats</span>
        <span>By invitation</span>
      </figcaption>
    </figure>
  );
}
