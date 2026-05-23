"use client";

import { cn } from "@/lib/cn";
import { DataLabel } from "@/components/ui/Marker";

export function ConsultHeroHeader({
  paid,
  className,
}: {
  paid: boolean;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-white/[0.06]", className)}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <DataLabel>Consultation</DataLabel>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              1v1 <span className="text-brand">Consultation</span>
            </h1>
            <p className="mt-2 max-w-2xl text-base text-white/50">
              Private consultation with the founding desk. Trade reviews,
              second opinions, blind-spot checks.
            </p>
          </div>
          <div className="text-sm">
            {paid ? (
              <span className="text-moss">Available</span>
            ) : (
              <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs text-white/30">PRO</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
