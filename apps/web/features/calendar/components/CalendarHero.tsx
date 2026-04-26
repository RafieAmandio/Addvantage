import { DataLabel } from "@/components/ui/Marker";
import { cn } from "@/lib/cn";

export function CalendarHero({ className }: { className?: string }) {
  return (
    <div className={cn("border-b border-gray-3 bg-gray-2/30", className)}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <DataLabel>Transmission TX-02 · Free pillar</DataLabel>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl text-white">
          Economic <span className="italic text-brand">Calendar</span>
        </h1>
        <p className="mt-2 max-w-2xl font-display text-lg text-white/60">
          Every high-impact release that moves global and IDX markets.
          Per-currency impact scoring, curated day summaries, and the
          desk's note on what actually matters — not the wire blurb.
        </p>
      </div>
    </div>
  );
}
