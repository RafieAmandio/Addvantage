import Link from "next/link";
import { SectionHeader } from "@/features/dashboard/components/SectionHeader";
import { cn } from "@/lib/cn";
import type { Primer } from "@/features/education/types";

export function DiscoveryRow({
  featuredPrimer,
  paid,
  className,
}: {
  featuredPrimer: Primer;
  paid: boolean;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-white/[0.06]", className)}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <SectionHeader n="03 /" label="Primer of the day" />
        <Link
          href={`/app/education/${featuredPrimer.id}`}
          className="mt-4 block max-w-lg rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:-translate-y-px hover:border-brand/40 hover:bg-white/[0.04] focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
        >
          <div className="text-xs text-white/40">
            {featuredPrimer.id} · {featuredPrimer.readingMin} min
          </div>
          <h3 className="mt-3 text-3xl font-bold leading-tight text-white">
            {featuredPrimer.title}
          </h3>
          <div className="mt-1 text-xs italic text-brand/70">
            {featuredPrimer.framework}
          </div>
          <p className="mt-4 text-sm text-white/70">
            {featuredPrimer.summary}
          </p>
          <div className="mt-4 text-xs text-white/40">
            Read primer →
          </div>
        </Link>
      </div>
    </section>
  );
}
