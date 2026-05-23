"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { PredictionCard } from "./PredictionCard";
import { PredictionCardSkeleton } from "./PredictionCardSkeleton";
import { PredictionModal } from "./PredictionModal";
import type { PredictionCardData } from "../types";

function GridShell({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn("mx-auto max-w-7xl px-4 sm:px-6", className)}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest2 text-white/40">
          Market Consensus
        </h2>
        <span className="font-mono text-[10px] text-white/20">POLYMARKET</span>
      </div>
      {children}
    </section>
  );
}

export function PredictionGrid({
  predictions,
  className,
}: {
  predictions: PredictionCardData[] | null;
  className?: string;
}) {
  const [selected, setSelected] = useState<PredictionCardData | null>(null);

  if (predictions === null) {
    return (
      <GridShell className={className}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <PredictionCardSkeleton key={i} />
          ))}
        </div>
      </GridShell>
    );
  }

  if (predictions.length === 0) {
    return (
      <GridShell className={className}>
        <p className="py-8 text-center text-xs text-white/30">
          Market data unavailable
        </p>
      </GridShell>
    );
  }

  return (
    <GridShell className={className}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {predictions.map((p) => (
          <PredictionCard
            key={p.tracked.id}
            data={p}
            onClick={() => setSelected(p)}
          />
        ))}
      </div>

      {selected && (
        <PredictionModal
          data={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </GridShell>
  );
}
