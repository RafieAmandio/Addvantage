"use client";

import { cn } from "@/lib/cn";

export function DashboardHero({
  stamp,
  greet,
  operatorName,
  highImpactToday,
  openSetups,
  className,
}: {
  stamp: string;
  greet: string;
  operatorName: string;
  highImpactToday: number;
  openSetups: number;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-white/[0.06]", className)}>
      <div className="mx-auto max-w-7xl px-4 pb-4 pt-6 sm:px-6 sm:pb-5 sm:pt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              <span suppressHydrationWarning>{greet}</span>,{" "}
              <span className="text-brand">{operatorName}</span>
            </h1>
            <p
              className="mt-1 text-xs text-white/50"
              suppressHydrationWarning
            >
              {stamp || " "}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs" role="status" aria-live="polite">
            {highImpactToday > 0 && (
              <span className="flex items-center gap-1.5 text-white/60">
                <span className="led motion-reduce:animate-none" aria-hidden />
                <span className="font-medium text-white">{highImpactToday}</span> high-impact
              </span>
            )}
            {openSetups > 0 && (
              <span className="text-white/60">
                <span className="font-medium text-white">{openSetups}</span> open setups
              </span>
            )}
            {highImpactToday === 0 && openSetups === 0 && (
              <span className="text-white/50">Markets are quiet today</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
