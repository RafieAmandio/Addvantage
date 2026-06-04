"use client";

import { useMemo, useState } from "react";
import type { ForexTier } from "@tradevantage/shared";
import { useGapData } from "@/features/gap-screener/hooks/useGapData";
import { GapToolbar } from "@/features/gap-screener/components/GapToolbar";
import { GapTable } from "@/features/gap-screener/components/GapTable";
import { GapList } from "@/features/gap-screener/components/GapList";

export default function GapScreenerClient() {
  const [activeTier, setActiveTier] = useState<ForexTier | "all">("all");
  const [activeStatus, setActiveStatus] = useState<"all" | "active" | "filled">("active");

  const { data, loading, error } = useGapData();

  const filteredPairs = useMemo(() => {
    if (!data) return [];
    return data.pairs.filter(
      (p) =>
        (activeTier === "all" || p.tier === activeTier) &&
        (activeStatus === "all" || p.status === activeStatus),
    );
  }, [data, activeTier, activeStatus]);

  const totalCount = data?.pairs.length ?? 0;

  return (
    <div className="min-h-screen">
      <div className="border-b border-white/[0.06] px-4 py-6 sm:px-6">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-lg font-bold text-white">
            Monday Gap Scanner
          </h1>
          {!loading && !error && totalCount > 0 && (
            <span className="flex items-center gap-1.5 rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] text-white/30">
              <span className="led" aria-hidden />
              {totalCount} gaps
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-white/30">
          Weekend gaps tend to fill back to Friday&apos;s close. Gap UP = SELL setup. Gap DOWN = BUY setup.
          Min gap 0.3%. SL at 1.5x gap size.
        </p>
      </div>

      <GapToolbar
        activeTier={activeTier}
        onTierChange={setActiveTier}
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        pairCount={filteredPairs.length}
        totalCount={totalCount}
        updatedAt={data?.updatedAt ?? null}
      />

      {loading && (
        <div className="flex items-center justify-center py-32">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-brand">
            <span className="led" aria-hidden />
            Scanning weekend gaps
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-12 text-center text-sm text-white/40 sm:px-6">
          {error}
        </div>
      )}

      {!loading && !error && filteredPairs.length === 0 && (
        <div className="px-4 py-20 text-center sm:px-6">
          <p className="text-sm text-white/30">
            {totalCount === 0
              ? "No gaps detected this week. Check back next Monday."
              : "No gaps match the selected filters."}
          </p>
        </div>
      )}

      {!loading && !error && filteredPairs.length > 0 && (
        <>
          <div className="hidden md:block">
            <GapTable pairs={filteredPairs} />
          </div>
          <div className="md:hidden">
            <GapList pairs={filteredPairs} />
          </div>
        </>
      )}
    </div>
  );
}
