import { cn } from "@/lib/cn";
import type { HeroData } from "@/features/marketing/lib/landing";
import { P, box, depthSort, leader, silhouette, viewBox, type B } from "@/features/marketing/lib/iso";
import { Block, Cylinder, GrainDefs, Leader, Rise, Slide, flat, type Face } from "./iso/Iso";
import { Build } from "./iso/Build";
import { CopyPrice } from "./iso/CopyPrice";
import { Ticker } from "./iso/Ticker";

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

type Item = { b: B; el: (key: number) => React.ReactNode };

/** The session clock's face: 24 h WIB dial, Asia, London and New York arcs, the hand on `hour`. */
function ClockFace({ hour }: { hour: number }) {
  const { cx, cy, r, h } = CLOCK;
  const z = h;
  const at = (rr: number, t: number): [number, number] => [cx + rr * Math.cos((2 * Math.PI * t) / 24), cy + rr * Math.sin((2 * Math.PI * t) / 24)];
  return (
    <g stroke="#111214" fill="none" vectorEffect="non-scaling-stroke">
      {Array.from({ length: 24 }, (_, i) => (
        <polyline key={i} points={flat([at(r * (i % 6 ? 0.88 : 0.8), i), at(r * 0.95, i)], z, U)} strokeWidth={i % 6 ? 0.7 : 1.1} />
      ))}
      {[[7, 16], [15, 24], [20, 29]].map(([a, b], j) => (
        <polyline key={j} points={flat(Array.from({ length: 41 }, (_, q) => at(r * (0.68 - j * 0.1), a! + ((b! - a!) * q) / 40)), z, U)} strokeWidth={j === 1 ? 2.2 : 1.3} />
      ))}
      <polyline points={flat([[cx, cy], at(r * 0.74, hour)], z, U)} strokeWidth={1.6} />
    </g>
  );
}

/**
 * The hero: the brand's isometric desk, drawn in code from a real hourly rejection. Candles
 * extrude one by one, the key level plate slides in, and the yellow candle wicks past the
 * level, then the part past it sinks back: rejected. Labels carry the exact prices.
 */
export function HeroDesk({ d, className }: { d: HeroData; className?: string }) {
  const n = d.bars.length;
  const lo = Math.min(d.level, ...d.bars.map((b) => b[3]));
  const hi = Math.max(d.level, ...d.bars.map((b) => b[2]));
  const z = (p: number) => BASE_Z + 0.3 + ((p - lo) / (hi - lo || 1)) * 6.0;
  const zL = z(d.level);
  const sell = d.side === "sell";
  const LIVE_AT = 300 + (n - 1) * 150;
  const hour = Number(d.fmt.time.slice(-9, -7)) + Number(d.fmt.time.slice(-6, -4)) / 60;

  const items: Item[] = [];
  const desk = box(0, 0, -0.35, 19, 13, 0.35);
  const base = box(0.5, 0.6, 0, 3.0, 11.8, BASE_Z);
  items.push({ b: base, el: (k) => <Block key={k} b={base} u={U} grain={G} /> });

  // The plate runs past the live candle at the back, so the wick can be seen going through it.
  const plate = box(0.6, -1.4, zL - 0.04, 0.85, 13.8, 0.08);
  items.push({
    b: plate,
    el: (k) => (
      <Slide key={k} v={[0, 5, 0]} u={U} at={700}>
        <Block b={plate} u={U} face="ink" />
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
    const extEl = ext && (
      <g clipPath={`url(#hx-ext)`}>
        <clipPath id="hx-ext">
          <polygon points={silhouette(ext, U)} />
        </clipPath>
        <g data-ext="" data-dy={((sell ? 1 : -1) * (ext[5] - ext[4]) * U).toFixed(1)} data-at={LIVE_AT + 500}>
          <Block b={ext} u={U} face="signal" grain={G} />
        </g>
      </g>
    );
    items.push({
      b: all,
      el: (k) => (
        <Rise key={k} id={`hx-c${i}`} b={all} u={U} from={BASE_Z} at={300 + i * 150}>
          {lowW && <Block b={lowW} u={U} face="ink" />}
          {!sell && extEl}
          <Block b={body} u={U} face={face} grain={G} />
          {upW && <Block b={upW} u={U} face="ink" />}
          {sell && extEl}
        </Rise>
      ),
    });
  });

  TOWERS.forEach(([x, y, h], j) => {
    const b = box(x, y, 0, 2.3, 2.3, h);
    items.push({
      b,
      el: (k) => (
        <Rise key={k} id={`hx-t${j}`} b={b} u={U} at={120 + j * 110}>
          <Block b={b} u={U} grain={G} />
        </Rise>
      ),
    });
  });

  const clockB: B = [CLOCK.cx - CLOCK.r, CLOCK.cx + CLOCK.r, CLOCK.cy - CLOCK.r, CLOCK.cy + CLOCK.r, 0, CLOCK.h];
  items.push({
    b: clockB,
    el: (k) => (
      <Slide key={k} v={[0, 0, 1.2]} u={U} at={260}>
        <Cylinder cx={CLOCK.cx} cy={CLOCK.cy} z={0} r={CLOCK.r} h={CLOCK.h} u={U}>
          <ClockFace hour={hour} />
        </Cylinder>
      </Slide>
    ),
  });

  const journal = box(14.2, 9.4, 0, 3.4, 2.4, 0.28);
  items.push({
    b: journal,
    el: (k) => (
      <Slide key={k} v={[0, 0, 1.2]} u={U} at={380}>
        <Block b={journal} u={U} grain={G} />
        <path
          d={[0, 1, 2, 3, 4].map((i) => {
            const yy = 9.4 + 0.45 + i * 0.38;
            const [a, b2] = P(14.2 + 0.35, yy, 0.28, U);
            const [c2, e] = P(14.2 + 3.4 - (i ? 0.35 : 1.1), yy, 0.28, U);
            return `M${a.toFixed(1)} ${b2.toFixed(1)}L${c2.toFixed(1)} ${e.toFixed(1)}`;
          }).join("")}
          stroke="#B9B8B3"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </Slide>
    ),
  });
  for (const [i, b] of [box(13.0, 5.4, 0, 2.0, 1.8, 1.0), box(4.6, 11.4, 0, 0.7, 0.7, 0.7), box(17.6, 5.6, 0, 0.7, 0.7, 1.8), box(10.6, 11.6, 0, 0.8, 0.8, 0.5)].entries())
    items.push({
      b,
      el: (k) => (
        <Rise key={k} id={`hx-p${i}`} b={b} u={U} at={200 + i * 90}>
          <Block b={b} u={U} grain={G} />
        </Rise>
      ),
    });

  // Spec labels: key level to the left column, the rejection to the right, towers above.
  const live = 1.2; // the live candle sits at the back of the row
  const colL = P(0.6, 12.0, 0, U)[0];
  const lvl = leader([0.6, 11.9, zL + 0.04], U, { dy: -46, col: colL });
  // Kit rule: leaders never cross a block face. A resistance wick has open sky above it, so its tip
  // carries the label; under a support the row is in the way, so the label hangs off the body's top edge.
  const colR = P(15.2, 0, 0, U)[0];
  const lb = d.bars[n - 1]!;
  const rej = sell
    ? leader([CX + CW / 2, live + CW / 2, z(hi)], U, { dy: -24, col: colR })
    : leader([CX + CW, live + CW / 2, z(Math.max(lb[1], lb[4]))], U, { dy: -86, col: colR });
  const towerL = TOWERS.map(([x, y, h]) => leader([x + 0.35, y + 0.3, h], U, { dy: -50, dx: 40 }));

  const vb = viewBox([desk, ...items.map((i) => i.b)], U, [70, 250, 30, 380]);
  const pos = (x: number, y: number) => ({ left: `${((x - vb.x) / vb.w) * 100}%`, top: `${((y - vb.y) / vb.h) * 100}%` });
  const floor = flat([[0.6, 0.6], [19.7, 0.6], [19.7, 13.8], [0.6, 13.8]], -0.35, U);

  return (
    <Build immediate className={cn("relative", className)} style={{ aspectRatio: `${vb.w} / ${vb.h}` }}>
      <svg viewBox={`${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <defs>
          <GrainDefs id={G} />
        </defs>
        <polygon points={floor} fill="#E4E3DE" />
        <Block b={desk} u={U} grain={G} />
        {depthSort(items).map((it, k) => it.el(k))}
        <Leader {...lvl} cue={LIVE_AT - 200} />
        <Leader {...rej} cue={LIVE_AT + 1500} />
        {towerL.map((t, j) => (
          <g key={j} className="tv-wide">
            <Leader {...t} cue={900 + j * 120} />
          </g>
        ))}
      </svg>

      <p className="sr-only">
        {d.sym} hourly, {d.fmt.time}: price wicked to {d.fmt.extreme} through the key level at {d.fmt.level} and closed back at {d.fmt.close}.
      </p>
      <div data-cue={LIVE_AT - 200} className="tv-label absolute -translate-x-full pr-2" style={pos(lvl.ex, lvl.ey)}>
        <span className="tv-label-main">Key level</span>
        <CopyPrice text={`${d.sym} ${d.fmt.level}`} className="tv-label-sub">
          {d.sym} <Ticker value={d.fmt.level} />
        </CopyPrice>
      </div>
      <div data-cue={LIVE_AT + 1500} className="tv-label absolute pl-2" style={pos(rej.ex, rej.ey)}>
        <span className="tv-label-main">Rejection H1</span>
        <span className="tv-label-sub">
          {sell ? "High" : "Low"} <Ticker value={d.fmt.extreme} />
        </span>
      </div>
      {d.towers.map((t, j) => (
        <div key={t.sym} data-cue={900 + j * 120} className="tv-label tv-wide absolute pl-2" style={pos(towerL[j]!.ex, towerL[j]!.ey)}>
          <span className="tv-label-main">{t.sym}</span>
          <span className="tv-label-sub">
            <Ticker value={t.val} />
          </span>
        </div>
      ))}
    </Build>
  );
}
