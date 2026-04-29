import { DataLabel } from "@/components/ui/Marker";
import { cn } from "@/lib/cn";

export function CalendarHero({ className }: { className?: string }) {
  return (
    <div className={cn("border-b border-white/[0.06]", className)}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <DataLabel>Calendar</DataLabel>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Economic <span className="text-brand">Calendar</span>
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-white/50">
          Every high-impact release that moves global and IDX markets.
          Per-currency impact scoring, curated day summaries, and the
          desk&apos;s note on what actually matters.
        </p>
      </div>
    </div>
  );
}
