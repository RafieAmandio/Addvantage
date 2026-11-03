"use client";

import { P, box, type B } from "@/features/marketing/lib/iso";
import { Block, Slide } from "@/features/marketing/components/iso/Iso";
import { Figure, type Item } from "@/features/marketing/components/iso/Figures";

const FOR = ["Experienced market participants leveling up their edge.", "Traders who need a second-opinion copilot for blind-spot coverage.", "Anyone who wants to activate Six Eyes on the market."];
const NOT = ["Beginners", "Gamblers", "Hobbyists"];

const U = 40;
const G = "tvg-gate";
const LANE = box(0, 0, -0.3, 16.2, 4.4, 0.3);
const GX = 10.2; // the gate's x
const GATE: B[] = [box(GX, -0.1, 0, 0.45, 0.45, 2.7), box(GX, 4.05, 0, 0.45, 0.45, 2.7), box(GX, -0.1, 2.7, 0.45, 4.6, 0.4)];
// The queue that stops at the gate, nearest the gate first.
const STOPPED: B[] = [box(7.3, 1.45, 0, 1.5, 1.5, 1.35), box(4.9, 1.45, 0, 1.5, 1.5, 1.7), box(2.5, 1.45, 0, 1.5, 1.5, 1.15)];
const PASSED = box(12.9, 1.3, 0, 1.8, 1.8, 2.1);

/** An ink stroke across a block's top face, left corner to right corner: struck. */
function Strike({ b }: { b: B }) {
  const [a, c] = [P(b[0] + 0.15, b[3] - 0.15, b[5], U), P(b[1] - 0.15, b[2] + 0.15, b[5], U)];
  return <path d={`M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${c[0].toFixed(1)} ${c[1].toFixed(1)}`} stroke="#111214" strokeWidth={2.2} strokeLinecap="square" vectorEffect="non-scaling-stroke" />;
}

/**
 * What this is, who it is for and who it is not for, as one scene: a lane on the desk with a
 * gate across it. Beginners, gamblers and hobbyists queue at the gate, struck; the experienced
 * trader is through it, the one Signal block. The lists are the scene's spec labels.
 */
export function PositioningSection() {
  const items: Item[] = [
    { id: "lane", b: LANE, el: (k) => <Block key={k} b={LANE} u={U} grain={G} /> },
    ...GATE.map((b, i) => ({
      id: `gate${i}`,
      b,
      info: i === 2 ? { main: "Filter", lines: ["Not a funnel"], aria: "The gate: onboarding is a filter, not a funnel" } : undefined,
      el: (k: number) => (
        <Slide key={k} v={[0, 0, 1.4]} u={U} at={120 + i * 80}>
          <Block b={b} u={U} face="ink" />
        </Slide>
      ),
    })),
    ...STOPPED.map((b, i) => ({
      id: `no${i}`,
      b,
      anchor: [(b[0] + b[1]) / 2, (b[2] + b[3]) / 2, b[5]] as [number, number, number],
      info: { main: NOT[i]!, lines: ["Stopped at the filter"], aria: `${NOT[i]}: not for them, stopped at the filter` },
      el: (k: number) => (
        <Slide key={k} v={[-3 - i * 1.4, 0, 0]} u={U} at={420 + i * 110}>
          <Block b={b} u={U} grain={G} />
          <Strike b={b} />
        </Slide>
      ),
    })),
    {
      id: "yes",
      b: PASSED,
      anchor: [(PASSED[0] + PASSED[1]) / 2, (PASSED[2] + PASSED[3]) / 2, PASSED[5]],
      info: { main: "Experienced trader", lines: ["Through the filter"], aria: "Experienced trader, through the filter" },
      el: (k) => (
        <Slide key={k} v={[-3.6, 0, 0]} u={U} at={900}>
          <Block b={PASSED} u={U} face="signal" grain={G} />
        </Slide>
      ),
    },
  ];
  const mid = STOPPED[1]!;
  return (
    <section id="positioning" className="relative z-10 flex flex-col justify-center overflow-hidden bg-tv-paper py-16 text-tv-ink md:min-h-[100svh] md:py-[clamp(3rem,8svh,5rem)]">
      <div className="mx-auto grid w-full max-w-[1240px] gap-y-8 px-4 sm:px-6 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-x-6 md:px-10">
        <div className="relative z-10 flex flex-col md:pt-6">
          <h2 className="text-[clamp(2.4rem,4.6vw,4rem)] font-semibold leading-[0.98] tracking-[-0.035em]">What this is</h2>
          <p className="mt-6 max-w-[24ch] text-[clamp(1.25rem,1.9vw,1.6rem)] leading-[1.3] tracking-[-0.01em]">
            A market radar powered by AI and professionals, created for experienced traders and investors.
          </p>
          <p className="mt-8 hidden max-w-[22rem] border-t border-tv-ink pt-4 text-[17px] leading-[1.45] md:mt-auto md:block">
            We don&apos;t soften this.
            <br />
            <span className="font-semibold">Onboarding is a filter, not a funnel.</span>
          </p>
        </div>
        <figure className="md:-mr-6 md:mt-4">
          <Figure
            id="gate"
            u={U}
            items={items}
            floor={[LANE]}
            pad={[270, 250, 24, 10]}
            maxH={76}
            className="mx-auto w-full"
            labels={[
              { anchor: [(mid[0] + mid[1]) / 2, (mid[2] + mid[3]) / 2, mid[5]], main: "Who this is not for", strikes: NOT, dy: -130, dx: 24, cue: 1100 },
              { anchor: [(PASSED[0] + PASSED[1]) / 2, (PASSED[2] + PASSED[3]) / 2, PASSED[5]], main: "Who this is for", sub: "Experienced trader", note: FOR, dy: -250, dx: 40, cue: 1400 },
            ]}
          />
          {/* On a phone the scene keeps its labels short; who it is for reads as plain lines under it. */}
          <ul className="mt-4 flex flex-col gap-2 border-t border-tv-stone pt-4 text-[16px] leading-[1.45] md:hidden">
            {FOR.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </figure>
        <p className="border-t border-tv-ink pt-4 text-[17px] leading-[1.45] md:hidden">
          We don&apos;t soften this.
          <br />
          <span className="font-semibold">Onboarding is a filter, not a funnel.</span>
        </p>
      </div>
    </section>
  );
}
