import { DataLabel } from "@/components/ui/Marker";
import { cn } from "@/lib/cn";

export function CalendarHero({ className }: { className?: string }) {
  return (
    <div className={cn("border-b border-ink-3 bg-ink-2/30", className)}>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <DataLabel>Transmission TX-02 · Free pillar</DataLabel>
        <h1 className="mt-2 font-display text-5xl text-paper">
          Economic <span className="italic text-lime">Calendar</span>
        </h1>
        <p className="mt-2 max-w-2xl font-display text-lg text-paper/60">
          Every high-impact release that moves global and IDX markets.
          Per-currency impact scoring, curated day summaries, and the
          desk's note on what actually matters — not the wire blurb.
        </p>
      </div>
    </div>
  );
}
