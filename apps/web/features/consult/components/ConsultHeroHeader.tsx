"use client";

import { cn } from "@/lib/cn";
import { DataLabel } from "@/components/ui/Marker";

/**
 * The page-wide title band above the consult workspace. Reads session state
 * from a single `paid` flag and renders the "SESSION OPEN" / "ACCESS DENIED"
 * status pill on the right.
 */
export function ConsultHeroHeader({
  paid,
  className,
}: {
  paid: boolean;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-gray-3 bg-gray-2/30", className)}>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <DataLabel>Transmission TX-04 · Restricted</DataLabel>
            <h1 className="mt-2 font-display text-5xl text-white">
              1v1 <span className="italic text-brand">Consultation</span>
            </h1>
            <p className="mt-2 max-w-2xl font-display text-base text-white/60">
              Private chat with the AI and the desk. Trade reviews. Second
              opinions. Blind-spot checks. Tagged into the same hashtag
              system as everything else.
            </p>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest2">
            <div className={paid ? "text-moss" : "text-red-500"}>
              ● {paid ? "SESSION OPEN" : "ACCESS DENIED"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
