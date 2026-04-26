import Link from "next/link";
import { DataLabel } from "@/components/ui/Marker";
import { cn } from "@/lib/cn";

export function PlanCompareHero({ className }: { className?: string }) {
  return (
    <div
      className={cn("border-b border-gray-3 bg-gray-2/30", className)}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <DataLabel>Transmission TX-03 · Compare</DataLabel>
            <h1 className="mt-2 font-display text-3xl text-white sm:text-4xl md:text-5xl">
              Plan <span className="italic text-brand">comparison</span>
            </h1>
            <p className="mt-2 max-w-2xl font-display text-lg text-white/60">
              Put two trading plans side by side. Common instruments
              highlight, R totals compare, thesis lines up for reading.
            </p>
          </div>
          <Link
            href="/app/plan/archive"
            className="border border-brand/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black"
          >
            ← Archive
          </Link>
        </div>
      </div>
    </div>
  );
}
