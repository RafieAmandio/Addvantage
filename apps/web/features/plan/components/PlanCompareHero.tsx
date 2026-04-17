import Link from "next/link";
import { DataLabel } from "@/components/ui/Marker";
import { cn } from "@/lib/cn";

export function PlanCompareHero({ className }: { className?: string }) {
  return (
    <div
      className={cn("border-b border-ink-3 bg-ink-2/30", className)}
    >
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <DataLabel>Transmission TX-03 · Compare</DataLabel>
            <h1 className="mt-2 font-display text-5xl text-paper">
              Plan <span className="italic text-lime">comparison</span>
            </h1>
            <p className="mt-2 max-w-2xl font-display text-lg text-paper/60">
              Put two trading plans side by side. Common instruments
              highlight, R totals compare, thesis lines up for reading.
            </p>
          </div>
          <Link
            href="/app/plan/archive"
            className="border border-lime/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
          >
            ← Archive
          </Link>
        </div>
      </div>
    </div>
  );
}
