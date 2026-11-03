import Link from "next/link";
import { Panel } from "@/components/ui/Panel";

const COPY = {
  lab: {
    title: "Chart Lab",
    body: "Key levels, breakouts and setups drawn on the chart for every market, with a plain suggestion for each level. We are finishing it now.",
  },
  scan: {
    title: "Morning Scan",
    body: "Read every market after the daily close, rate how clear each one is, and finish with a ranked plan for the day. We are finishing it now.",
  },
} as const;

/** Production placeholder for the Lab tools (Chart Lab, Morning Scan) while they are finished in demo mode. */
export function LabComingSoon({ tool = "lab" }: { tool?: keyof typeof COPY }) {
  const { title, body } = COPY[tool];
  return (
    <Panel className="mx-auto mt-6 w-full max-w-[640px]" bodyClassName="flex flex-col items-start gap-5 py-6 sm:px-4">
      <span className="rounded-full border border-brand/30 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand">Coming soon</span>
      <div>
        <h1 className="font-display text-[34px] leading-none text-white">{title}</h1>
        <p className="mt-3 max-w-[48ch] text-[15px] leading-[22px] text-white/60">{body}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/app/atr" className="rounded-xl bg-brand px-4 py-2 text-[14px] font-semibold text-black transition-colors hover:bg-brand/90">
          Open ATR Levels
        </Link>
        <Link href="/app/heatmap" className="rounded-xl border border-white/10 px-4 py-2 text-[14px] font-medium text-white/80 transition-colors hover:bg-white/5">
          RSI Heatmap
        </Link>
      </div>
    </Panel>
  );
}
