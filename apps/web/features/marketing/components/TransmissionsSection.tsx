"use client";

import { cn } from "@/lib/cn";
import { pillars } from "@/features/marketing/lib/data";
import { C, P, S, box, type B } from "@/features/marketing/lib/iso";
import { Block, Slide, flat } from "@/features/marketing/components/iso/Iso";
import { Figure, type Item } from "@/features/marketing/components/iso/Figures";
import { useInspect } from "@/features/marketing/components/iso/Inspect";

const U = 34;
const G = "tvg-tx";
const BOARD = box(0, 0, -0.35, 13.4, 10.4, 0.35);
const PLINTH = box(8.7, 0.4, 0, 4.3, 9.6, 0.3); // VIP+ stands a step up
const Z = PLINTH[5];
const HAIR = { stroke: "#111214", strokeWidth: 0.9, vectorEffect: "non-scaling-stroke" as const, fill: "none" };

/** Text printed flat on the desk along world x, like a stencil on a shop floor. */
function Stencil({ x, y, z = 0, text, size = 0.46, fill = "#111214" }: { x: number; y: number; z?: number; text: string; size?: number; fill?: string }) {
  const [ox, oy] = P(x, y, z, U);
  return (
    <text transform={`matrix(${C * U} ${S * U} ${-C * U} ${S * U} ${ox.toFixed(1)} ${oy.toFixed(1)})`} fontSize={size} className="font-mono" fill={fill} letterSpacing={0.04} fontWeight={500}>
      {text}
    </text>
  );
}

/** Lines on a block's top face, along x at the given y offsets. */
const ruled = (b: B, ys: number[], inset = 0.3, short = -1) =>
  ys
    .map((y, i) => {
      const [a, c] = P(b[0] + inset, b[2] + y, b[5], U);
      const [d, e] = P(b[1] - inset - (i === short ? (b[1] - b[0]) * 0.4 : 0), b[2] + y, b[5], U);
      return `M${a.toFixed(1)} ${c.toFixed(1)}L${d.toFixed(1)} ${e.toFixed(1)}`;
    })
    .join("");

type Obj = { cell: [number, number]; z?: number; bound: B; draw: () => React.ReactNode };

function objects(): Obj[] {
  // Back row (low y): the tall mast, the calendar, the plan sheet. Front row: only low things, so
  // nothing in front hides a stencil behind it.
  // TX-01 news: a stack of three slabs, each a headline, offset as they were dropped.
  const n = [box(1, 6.4, 0, 2.8, 2.0, 0.24), box(1.2, 6.55, 0.24, 2.8, 2.0, 0.24), box(1.05, 6.75, 0.48, 2.8, 2.0, 0.24)];
  // TX-02 calendar: a slab with a 6 by 4 grid, one day inked in.
  const cal = box(4.9, 1.0, 0, 3.0, 2.6, 0.32);
  const cells = Array.from({ length: 4 }, (_, j) => cal[2] + 0.25 + j * 0.55);
  const cols = Array.from({ length: 6 }, (_, i) => cal[0] + 0.25 + i * 0.5);
  // TX-03 plan: a sheet on the plinth with the plan's lines and its level, the one Signal.
  const sheet = box(9.3, 1.0, Z, 3.0, 2.8, 0.1);
  // TX-04 consultation: two chairs facing each other across a gap.
  const backA = box(9.3, 6.8, Z, 0.25, 1.1, 1.15);
  const seatA = box(9.55, 6.8, Z, 1.0, 1.1, 0.5);
  const seatB = box(11.2, 6.8, Z, 1.0, 1.1, 0.5);
  const backB = box(12.2, 6.8, Z, 0.25, 1.1, 1.15);
  // TX-05 education: three books, stacked.
  const books = [box(5.0, 6.5, 0, 2.6, 1.9, 0.42), box(5.2, 6.65, 0.42, 2.3, 1.7, 0.36), box(5.1, 6.6, 0.78, 2.5, 1.8, 0.3)];
  // TX-06 channel: a mast on a base with two cross arms, broadcasting.
  const base = box(1.6, 1.4, 0, 1.6, 1.6, 0.3);
  const mast = box(2.2, 2.0, 0.3, 0.4, 0.4, 3.9);
  // Each arm goes through the mast, so it is drawn as the half behind it and the half in front.
  const arms = [box(1.6, 2.1, 3.2, 0.6, 0.2, 0.16), box(1.9, 2.1, 3.8, 0.3, 0.2, 0.16)];
  const armsFront = [box(2.6, 2.1, 3.2, 0.6, 0.2, 0.16), box(2.6, 2.1, 3.8, 0.3, 0.2, 0.16)];
  return [
    { cell: [1, 9.45], bound: [1, 4.05, 6.4, 8.75, 0, 0.72], draw: () => n.map((b, i) => <g key={i}><Block b={b} u={U} grain={G} /><path d={ruled(b, [0.45, 0.85, 1.25], 0.35, 2)} stroke="#B9B8B3" strokeWidth={1} vectorEffect="non-scaling-stroke" /></g>) },
    {
      cell: [4.9, 4.3],
      bound: cal,
      draw: () => (
        <>
          <Block b={cal} u={U} grain={G} />
          <g {...HAIR} stroke="#9C9B96">
            {cells.map((y) => <polyline key={y} points={flat([[cal[0] + 0.25, y], [cal[1] - 0.25, y]], cal[5], U)} />)}
            {cols.map((x) => <polyline key={x} points={flat([[x, cal[2] + 0.25], [x, cal[3] - 0.4]], cal[5], U)} />)}
          </g>
          <polygon points={flat([[cols[2]!, cells[1]!], [cols[3]!, cells[1]!], [cols[3]!, cells[2]!], [cols[2]!, cells[2]!]], cal[5], U)} fill="#111214" />
        </>
      ),
    },
    {
      cell: [9.3, 4.5],
      bound: sheet,
      draw: () => (
        <>
          <Block b={sheet} u={U} grain={G} />
          <path d={ruled(sheet, [0.45, 0.8, 1.15, 2.1, 2.45], 0.35, 0)} stroke="#B9B8B3" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <polygon points={flat([[sheet[0] + 0.3, sheet[2] + 1.48], [sheet[1] - 0.3, sheet[2] + 1.48], [sheet[1] - 0.3, sheet[2] + 1.72], [sheet[0] + 0.3, sheet[2] + 1.72]], sheet[5], U)} fill="#FFD400" stroke="#111214" strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
        </>
      ),
    },
    {
      cell: [9.3, 8.6],
      bound: [9.3, 12.45, 6.8, 7.9, Z, Z + 1.15],
      draw: () => (
        <>
          <Block b={backA} u={U} face="graphite" grain={G} />
          <Block b={seatA} u={U} face="graphite" grain={G} />
          <Block b={seatB} u={U} face="graphite" grain={G} />
          <Block b={backB} u={U} face="graphite" grain={G} />
        </>
      ),
    },
    { cell: [5, 9.45], bound: [5.0, 7.7, 6.5, 8.4, 0, 1.08], draw: () => books.map((b, i) => <Block key={i} b={b} u={U} grain={G} face={i === 1 ? "graphite" : "white"} />) },
    {
      cell: [1, 4.3],
      bound: [1.6, 3.2, 1.4, 3.0, 0, 4.2],
      draw: () => (
        <>
          <Block b={base} u={U} grain={G} />
          {arms.map((b, i) => <Block key={i} b={b} u={U} face="ink" />)}
          <Block b={mast} u={U} grain={G} />
          {armsFront.map((b, i) => <Block key={i} b={b} u={U} face="ink" />)}
        </>
      ),
    },
  ];
}

/**
 * The six transmissions as one board on the desk: a news stack, a calendar, the plan sheet,
 * two chairs, a pile of books and a channel mast. Codes are stencilled on the desk; VIP+ stands
 * a step up on the graphite plinth. The parts list beside it carries the words. Hover, tap or
 * focus an object (or its row) to inspect it; the two stay in step.
 */
export function TransmissionsSection() {
  const ins = useInspect();
  const objs = objects();
  const items: Item[] = [
    { id: "board", b: BOARD, el: (k) => <Block key={k} b={BOARD} u={U} grain={G} /> },
    { id: "plinth", b: PLINTH, el: (k) => <Block key={k} b={PLINTH} u={U} face="graphite" grain={G} /> },
    ...objs.map((o, i) => {
      const p = pillars[i]!;
      return {
        id: p.code,
        b: o.bound,
        info: { main: `${p.code} ${p.title}`, aria: `${p.code}, ${p.title}, ${p.locked ? "VIP+" : "free"}. ${p.desc}` },
        el: (k: number) => (
          <Slide key={k} v={[0, 0, 1.6]} u={U} at={200 + i * 110}>
            {o.draw()}
          </Slide>
        ),
      };
    }),
  ];
  const stencils = (
    <g>
      {objs.map((o, i) => (
        <Stencil key={i} x={o.cell[0]} y={o.cell[1]} z={o.cell[0] > 8.7 ? Z : 0} fill={o.cell[0] > 8.7 ? "#F4F3EF" : "#111214"} text={`${pillars[i]!.code}  ${pillars[i]!.locked ? "VIP+" : "FREE"}`} />
      ))}
    </g>
  );
  return (
    <section id="transmissions" className="relative z-10 flex flex-col justify-center overflow-hidden bg-tv-paper py-12 text-tv-ink md:min-h-[100svh] md:py-[clamp(3rem,7svh,4.5rem)]">
      <div className="mx-auto grid w-full max-w-[1240px] items-center gap-y-6 px-4 sm:px-6 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-x-12 md:px-10">
        <Figure id="tx" u={U} items={items} floor={[BOARD]} labels={[]} pad={[30, 20, 30, 20]} maxH={78} inspect={ins} tip={false} over={stencils} className="mx-auto w-full md:order-none" />
        <div>
          <h2 className="text-[clamp(2.2rem,3.6vw,3.25rem)] font-semibold leading-[1] tracking-[-0.03em]">Transmissions</h2>
          <ol className="mt-6 border-t border-tv-ink md:mt-8">
            {pillars.map((p) => {
              const on = ins.active === p.code;
              return (
                <li
                  key={p.code}
                  onPointerEnter={(e) => e.pointerType === "mouse" && ins.set(p.code)}
                  onPointerLeave={(e) => e.pointerType === "mouse" && ins.clear()}
                  className={cn("grid grid-cols-[3.5rem_1fr_auto] gap-x-3 border-b border-tv-stone py-2.5 transition-colors duration-200 md:grid-cols-[4.25rem_1fr_auto] md:py-3", on && "bg-tv-white")}
                >
                  <span className={cn("pl-1 pt-[3px] font-mono text-[12px] tabular-nums", on ? "text-tv-ink" : "text-tv-mute")}>{p.code}</span>
                  <span>
                    <span className="block text-[17px] font-semibold leading-[1.3] tracking-[-0.01em]">{p.title}</span>
                    <span className="mt-0.5 block max-w-[46ch] text-[14px] leading-[1.4] text-tv-graphite md:text-[15px] md:leading-[1.45]">{p.desc}</span>
                  </span>
                  <span className={cn("pr-1 pt-[3px] font-mono text-[12px] font-medium", p.locked ? "text-tv-ink" : "text-tv-mute")}>{p.locked ? "VIP+" : "FREE"}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
