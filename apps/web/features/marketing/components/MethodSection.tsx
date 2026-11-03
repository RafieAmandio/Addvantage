"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { WIRE } from "@/features/marketing/lib/data";
import type { PlanData, ReadData } from "@/features/marketing/lib/landing";
import { C, P, S, box, type B, type V3 } from "@/features/marketing/lib/iso";
import { Block, Shadow, Slide, flat } from "@/features/marketing/components/iso/Iso";
import { Figure, type Item } from "@/features/marketing/components/iso/Figures";
import { useInspect } from "@/features/marketing/components/iso/Inspect";

const STEPS = [
  {
    title: "Filter",
    line: "Most news is noise. We cut it.",
    body: "Every headline gets read for one thing: does it move price. Noise is struck out. What is left is tagged with its impact and which way it pushes.",
  },
  {
    title: "Read",
    line: "The level, drawn for you. Then by you.",
    body: "The hourly chart finds the break, the last high or low before it, the stop and the target, and says what R is on the table. Same rules every time.",
  },
  {
    title: "Execute",
    line: "A journal that says no.",
    body: "Type a plan and the method checks it. Risk over the cap, a stop on the wrong side, a limit past the day's range: the save button refuses until it's fixed.",
  },
];

const U = 30;
const G = "tvg-lab";
const FLOOR = -1.7; // the night floor, under the desk
const DESK = box(0, 0, -0.35, 17, 12, 0.35);
const KEPT = WIRE.filter((w) => w.tag);
const NOISE = WIRE.filter((w) => !w.tag);
// Station one: the kept headlines stacked on the desk, the noise struck and dropped to the floor in front.
const STACK = KEPT.map((_, i) => box(1.2 + (i % 2) * 0.14, 7.4 + i * 0.12, i * 0.22, 3.4, 2.4, 0.22));
const FALLEN: B[] = [box(0.4, 13.2, FLOOR, 3.0, 2.0, 0.18), box(3.8, 13.6, FLOOR, 3.0, 2.0, 0.18), box(1.0, 15.7, FLOOR, 3.0, 2.0, 0.18), box(4.6, 16.2, FLOOR, 3.0, 2.0, 0.18)];
// Station two: the hourly chart, printed on a plate lying on the desk; price runs back into the desk.
const PLATE = box(5.6, 0.9, 0, 10.4, 5.4, 0.12);
// Station three: the journal and the ticket that asked for 3%.
const JOURNAL = box(8.6, 7.6, 0, 4.6, 3.4, 0.42);
const TICKET = box(14.0, 8.4, 0, 1.8, 2.1, 0.22);
const STATIONS = ["filter", "read", "execute"];

/** A stroke across a slab's top face, left corner to right corner. */
const strike = (b: B) => {
  const [a, c] = [P(b[0] + 0.2, b[3] - 0.2, b[5], U), P(b[1] - 0.2, b[2] + 0.2, b[5], U)];
  return `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${c[0].toFixed(1)} ${c[1].toFixed(1)}`;
};

/** Text lying on a top face along world x, turned `deg` in that plane, centred on (x, y). */
function FlatText({ x, y, z, deg = 0, size, children, className }: { x: number; y: number; z: number; deg?: number; size: number; children: React.ReactNode; className?: string }) {
  const [ox, oy] = P(x, y, z, U);
  const r = (deg * Math.PI) / 180;
  // World x and y on screen, then the in-plane turn.
  const ax = [C * U, S * U];
  const ay = [-C * U, S * U];
  const m = [ax[0]! * Math.cos(r) + ay[0]! * Math.sin(r), ax[1]! * Math.cos(r) + ay[1]! * Math.sin(r), -ax[0]! * Math.sin(r) + ay[0]! * Math.cos(r), -ax[1]! * Math.sin(r) + ay[1]! * Math.cos(r)];
  return (
    <g transform={`matrix(${m.map((n) => n.toFixed(3)).join(" ")} ${ox.toFixed(1)} ${oy.toFixed(1)})`}>
      <g className={className} fontSize={size}>
        {children}
      </g>
    </g>
  );
}

/** The hourly chart flat on the plate: candles along x, price back into the desk, the level in Signal. */
function Chart({ d }: { d: ReadData }) {
  const n = d.bars.length;
  const lo = Math.min(...d.bars.map((b) => b[3]), d.stop, d.target);
  const hi = Math.max(...d.bars.map((b) => b[2]), d.stop, d.target);
  const z = PLATE[5];
  const x0 = PLATE[0] + 0.3;
  const span = PLATE[1] - PLATE[0] - 1.4; // room on the right for the stop and target
  const slot = span / n;
  const y = (p: number) => PLATE[3] - 0.25 - ((p - lo) / (hi - lo || 1)) * (PLATE[3] - PLATE[2] - 0.5);
  const xs = (i: number) => x0 + (i + 0.5) * slot;
  const strip = (p: number, from: number, to: number, w: number) => flat([[from, y(p) - w], [to, y(p) - w], [to, y(p) + w], [from, y(p) + w]], z, U);
  const end = PLATE[1] - 0.2;
  return (
    <g>
      {d.bars.map(([t, o, h, l, c], i) => {
        const up = c >= o;
        const w = slot * 0.32;
        return (
          <g key={t}>
            <polyline points={flat([[xs(i), y(h)], [xs(i), y(l)]], z, U)} stroke="#111214" strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
            <polygon points={flat([[xs(i) - w, y(Math.max(o, c))], [xs(i) + w, y(Math.max(o, c))], [xs(i) + w, y(Math.min(o, c))], [xs(i) - w, y(Math.min(o, c))]], z, U)} fill={up ? "#FFFFFF" : "#3A3C40"} stroke="#111214" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}
      {[d.stop, d.target].map((p) => (
        <polyline key={p} points={flat([[xs(d.thrust), y(p)], [end, y(p)]], z, U)} stroke="#111214" strokeWidth={0.9} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" fill="none" />
      ))}
      <polygon points={strip(d.price, xs(d.touch), end, 0.06)} fill="#FFD400" stroke="#111214" strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
    </g>
  );
}

/**
 * The Lab: the one dark band on the page, a night desk with the method as a production line.
 * Headlines come in as slabs and the noise is struck off the desk; the hourly chart lies on a
 * plate with the level drawn in Signal; the journal stamps NO on a plan that risks 3%. Pick a
 * station (click, tap, or tab and Enter) and its words come up; until then it walks through them.
 */
export function MethodSection({ read, plan }: { read: ReadData; plan: PlanData }) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState(false);
  const [seen, setSeen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const ins = useInspect();

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => setSeen(!!e?.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!seen || picked) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % 3), 6500);
    return () => clearTimeout(t);
  }, [seen, picked, step]);

  const pick = (i: number) => {
    setStep(i);
    setPicked(true);
  };
  const buy = read.side === "buy";
  const s = STEPS[step]!;
  const station = (i: number, aria: string) => ({ main: STEPS[i]!.title, aria, onPress: () => pick(i) });
  const facts = [`${NOISE.length} cut / ${KEPT.length} kept`, `${read.sym} 1H, ${buy ? "LHPB" : "LLPB"} ${read.fmt.price}, stop ${read.fmt.stop}, target ${read.fmt.target}, ${read.r}R`, `Risk ${plan.over.risk}%, refused`];
  const top = (b: B): V3 => [(b[0] + b[1]) / 2, (b[2] + b[3]) / 2, b[5]];

  const items: Item[] = [
    { id: "desk", b: DESK, el: (k) => <Block key={k} b={DESK} u={U} grain={G} /> },
    {
      id: "fallen",
      b: [0.4, 7.6, 13.2, 18.2, FLOOR, FLOOR + 0.18],
      el: (k) => (
        <Slide key={k} v={[0, -3.5, 1.8]} u={U} at={700}>
          {FALLEN.map((b, i) => (
            <g key={i} opacity={0.9}>
              <Block b={b} u={U} grain={G} />
              <path d={strike(b)} stroke="#111214" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </Slide>
      ),
    },
    {
      id: STATIONS[0]!,
      b: [1.2, 4.74, 7.4, 10.16, 0, 0.88],
      info: station(0, `Filter: ${KEPT.length} headlines kept and tagged, ${NOISE.length} struck as noise. Press to read the step.`),
      el: (k) => (
        <Slide key={k} v={[0, -3, 0]} u={U} at={200}>
          {STACK.map((b, i) => (
            <g key={i}>
              <Block b={b} u={U} grain={G} />
              <polyline points={flat([[b[0] + 0.3, b[2] + 0.5], [b[1] - 1.2, b[2] + 0.5]], b[5], U)} stroke="#B9B8B3" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </Slide>
      ),
    },
    {
      id: STATIONS[1]!,
      b: PLATE,
      info: station(1, `Read: ${read.sym} hourly, level ${read.fmt.price}, stop ${read.fmt.stop}, target ${read.fmt.target}, ${read.r}R. Press to read the step.`),
      el: (k) => (
        <Slide key={k} v={[0, 0, 1.2]} u={U} at={400}>
          <Block b={PLATE} u={U} grain={G} />
          <Chart d={read} />
        </Slide>
      ),
    },
    {
      id: STATIONS[2]!,
      b: [JOURNAL[0], TICKET[1], JOURNAL[2], JOURNAL[3], 0, JOURNAL[5]],
      info: station(2, `Execute: a plan at ${plan.over.risk}% risk is refused. ${plan.over.refusal} Press to read the step.`),
      el: (k) => (
        <Slide key={k} v={[0, 0, 1.2]} u={U} at={600}>
          <Block b={JOURNAL} u={U} grain={G} />
          {[0.55, 0.95, 1.35, 1.75, 2.15, 2.55].map((yy, i) => (
            <polyline key={yy} points={flat([[JOURNAL[0] + 0.4, JOURNAL[2] + yy], [JOURNAL[1] - (i ? 0.4 : 1.8), JOURNAL[2] + yy]], JOURNAL[5], U)} stroke="#B9B8B3" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          <Block b={TICKET} u={U} grain={G} />
          <FlatText x={(TICKET[0] + TICKET[1]) / 2} y={(TICKET[2] + TICKET[3]) / 2} z={TICKET[5]} size={0.8}>
            <text className="font-mono" fill="#111214" fontWeight={600} textAnchor="middle" dominantBaseline="central">{`${plan.over.risk}%`}</text>
          </FlatText>
          {/* The stamp: a ruled box with NO, slammed down when the station is up. */}
          <g key={step === 2 ? "on" : "off"} className={cn(step === 2 && "lv-thud")}>
            <FlatText x={(JOURNAL[0] + JOURNAL[1]) / 2} y={(JOURNAL[2] + JOURNAL[3]) / 2} z={JOURNAL[5]} deg={-10} size={1.2}>
              <rect x={-1.35} y={-0.62} width={2.7} height={1.24} fill="none" stroke="#111214" strokeWidth={2.2} vectorEffect="non-scaling-stroke" />
              <text className="font-mono" fill="#111214" fontWeight={600} textAnchor="middle" dominantBaseline="central" letterSpacing={0.05}>
                NO
              </text>
            </FlatText>
          </g>
        </Slide>
      ),
    },
  ];

  // A faint iso grid on the floor under the desk, the kit's dark-scene ground.
  const grid = Array.from({ length: 36 }, (_, k) => k - 8)
    .flatMap((k) => [
      [P(k, -8, FLOOR, U), P(k, 24, FLOOR, U)],
      ...(k <= 24 ? [[P(-8, k, FLOOR, U), P(28, k, FLOOR, U)]] : []),
    ])
    .map(([a, b]) => `M${a![0].toFixed(1)} ${a![1].toFixed(1)}L${b![0].toFixed(1)} ${b![1].toFixed(1)}`)
    .join("");
  const under = (
    <g>
      <radialGradient id="lab-fade-g">
        <stop offset="0.35" stopColor="#fff" />
        <stop offset="0.8" stopColor="#000" />
      </radialGradient>
      <mask id="lab-fade" maskContentUnits="objectBoundingBox">
        <rect width={1} height={1} fill="url(#lab-fade-g)" />
      </mask>
      <path d={grid} mask="url(#lab-fade)" fill="none" stroke="#2E3035" strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
      {/* The desk stands above the floor: its flat shadow lands on the grid, offset. */}
      <Shadow b={DESK} u={U} z={FLOOR} off={1.1} fill="#08090A" />
    </g>
  );

  return (
    <section ref={ref} id="method" className="tv-on-desk tv-night relative z-10 flex flex-col justify-center overflow-hidden bg-tv-desk py-16 text-tv-paper md:min-h-[100svh] md:py-[clamp(3rem,7svh,4.5rem)]">
      <div className="mx-auto grid w-full max-w-[1240px] items-center gap-y-6 px-4 sm:px-6 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-x-4 md:px-10">
        <div className="relative z-10 flex flex-col">
          <h2 className="text-[clamp(2.4rem,min(5vw,8svh),4.25rem)] font-semibold leading-[0.98] tracking-[-0.035em]">
            Filter. Read.
            <br />
            Execute.
          </h2>
          <p className="mt-5 max-w-[34ch] text-[17px] leading-relaxed text-[#B5B7BB]">Signals tell you what to do. This shows you how to see it, then stops you when you don&apos;t.</p>

          <div className="mt-8 border-t border-[#2E3035] pt-5 md:mt-10" aria-live="polite">
            <p className="flex gap-5 font-mono text-[12px] uppercase tracking-[0.08em]">
              {STEPS.map((x, i) => (
                <button
                  key={x.title}
                  type="button"
                  aria-pressed={step === i}
                  onClick={() => pick(i)}
                  className={cn("tv-tab py-1", step === i ? "text-tv-paper" : "text-[#8A8C91]")}
                >
                  {String(i + 1).padStart(2, "0")} {x.title}
                </button>
              ))}
            </p>
            <div key={step} className="lv-in mt-5 min-h-[11.5rem]">
              <h3 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em]">{s.line}</h3>
              <p className="mt-3 max-w-[44ch] text-[16px] leading-[1.55] text-[#B5B7BB]">{s.body}</p>
              {/* Phone: the scene drops its long labels, so the station's numbers read here. */}
              <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.06em] text-[#9A9CA1] md:hidden">{facts[step]}</p>
            </div>
          </div>
        </div>

        <Figure
          id="lab"
          u={U}
          items={items}
          floor={[]}
          quiet={false}
          pad={[90, 210, 10, 30]}
          maxH={80}
          inspect={{ ...ins, active: ins.active ?? STATIONS[step]! }}
          tip={false}
          under={under}
          className="mx-auto w-full md:w-[calc(100%+4vw)] md:-mr-[4vw]"
          labels={[
            { anchor: top(STACK.at(-1)!), main: "01 Filter", sub: `${NOISE.length} cut / ${KEPT.length} kept`, dy: -150, dx: -18, cue: 900 },
            { anchor: [PLATE[1] - 0.3, PLATE[2] + 0.3, PLATE[5]], main: `02 Read, ${read.sym} 1H`, lines: [`${buy ? "LHPB" : "LLPB"} ${read.fmt.price}`, `Stop ${read.fmt.stop}`, `Target ${read.fmt.target}`, `${read.r}R`], dy: -40, dx: 30, cue: 1100, className: "tv-wide" },
            { anchor: top(TICKET), main: "03 Execute", lines: [`Risk ${plan.over.risk}%`, "Refused"], dy: 6, dx: 134, cue: 1300, className: "tv-wide" },
          ]}
        />
      </div>
    </section>
  );
}
