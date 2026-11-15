import { cn } from "@/lib/cn";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Panel } from "@/components/ui/Panel";
import type { FearGreedPoint } from "@/features/dashboard/lib/fear-greed";

/** 0 to 24 extreme fear, 25 to 44 fear, 45 to 55 neutral, 56 to 75 greed, 76 up extreme greed (alternative.me bands). */
const tone = (v: number) => (v < 45 ? "text-down" : v > 55 ? "text-up" : "text-white");

export function FearGreedPanel({ points }: { points: FearGreedPoint[] }) {
  const now = points[0];
  const past = [
    { label: "Yesterday", p: points[1] },
    { label: "Last week", p: points[7] },
    { label: "Last month", p: points[30] },
  ];
  // Oldest to newest for the line.
  const line = [...points].reverse();
  const W = 300;
  const H = 40;
  const path = line.map((p, i) => `${i === 0 ? "M" : "L"}${((i / Math.max(1, line.length - 1)) * W).toFixed(1)},${(H - (p.value / 100) * H).toFixed(1)}`).join(" ");

  return (
    <Panel
      title="BTC Fear & Greed"
      sub="Crypto sentiment, 0 is extreme fear, 100 is extreme greed"
      action={<a href="https://alternative.me/crypto/fear-and-greed-index/" target="_blank" rel="noreferrer" className="text-[12px] text-white/40 hover:text-white">alternative.me</a>}
      className="surface-hover"
    >
      {!now ? (
        <p className="py-6 text-[14px] text-white/40">The index isn&apos;t available right now.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <div className={cn("font-num text-[40px] font-semibold leading-10", tone(now.value))}>
              <AnimatedNumber value={now.value} from={0} format={(v) => String(Math.round(v))} />
            </div>
            <div className={cn("pb-1 text-[14px] font-semibold", tone(now.value))}>{now.label}</div>
          </div>
          <div className="relative h-1.5 rounded-full bg-gradient-to-r from-down via-white/40 to-up" aria-hidden>
            <span className="absolute -top-1 h-3.5 w-1 -translate-x-1/2 rounded-full bg-white shadow" style={{ left: `${now.value}%` }} />
          </div>
          {line.length > 1 && (
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-10 w-full" aria-label="Last 30 days">
              <line x1="0" x2={W} y1={H / 2} y2={H / 2} className="stroke-white/10" strokeDasharray="2 3" />
              <path d={path} fill="none" className="stroke-white/60" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
          )}
          <dl className="grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-3">
            {past.map(({ label, p }) => (
              <div key={label}>
                <dt className="text-[12px] text-white/40">{label}</dt>
                <dd className={cn("font-num text-[16px] font-semibold", p ? tone(p.value) : "text-white/30")}>{p ? p.value : "-"}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </Panel>
  );
}
