import Link from "next/link";
import { DataLabel } from "@/components/ui/Marker";
import { cn } from "@/lib/cn";

type Props = {
  onExportDigest: () => void;
  className?: string;
};

export function PlanArchiveHeader({ onExportDigest, className }: Props) {
  return (
    <div className={cn("border-b border-gray-3 bg-gray-2/30", className)}>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <DataLabel>Transmission TX-03 · Archive</DataLabel>
            <h1 className="mt-2 font-display text-5xl text-white">
              Plan <span className="italic text-brand">Archive</span>
            </h1>
            <p className="mt-2 max-w-2xl font-display text-lg text-white/60">
              Every trading plan the desk has shipped. Historical plans are kept
              on record so you can read the thesis alongside how it played out —
              not scrubbed when the trade closes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/app/plan/compare"
              title="Put two plans side by side"
              className="border border-gray-3 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-white/60 hover:border-brand hover:text-brand"
            >
              ⇌ COMPARE
            </Link>
            <button
              onClick={onExportDigest}
              title="Copy archive as markdown digest"
              className="border border-gray-3 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-white/60 hover:border-brand hover:text-brand"
            >
              ⇩ EXPORT DIGEST
            </button>
            <Link
              href="/app/plan"
              className="border border-brand/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black"
            >
              ← Current plan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
