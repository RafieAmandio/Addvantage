interface Props {
  pinnedCount: number;
  totalNews: number;
  totalLive: number;
  totalClosed: number;
  aggregateR: number;
}

export function WatchlistStatsStrip({
  pinnedCount,
  totalNews,
  totalLive,
  totalClosed,
  aggregateR,
}: Props) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-px bg-gray-3 sm:grid-cols-4">
      <div className="bg-black p-5">
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          Pinned
        </div>
        <div className="mt-1 font-display text-3xl text-brand">{pinnedCount}</div>
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          instruments
        </div>
      </div>
      <div className="bg-black p-5">
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          News mentions
        </div>
        <div className="mt-1 font-display text-3xl text-white">{totalNews}</div>
      </div>
      <div className="bg-black p-5">
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          Live setups
        </div>
        <div className="mt-1 font-display text-3xl text-white">{totalLive}</div>
      </div>
      <div className="bg-black p-5">
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          Archive R · {totalClosed} closed
        </div>
        <div
          className={
            "mt-1 font-display text-3xl " +
            (aggregateR > 0
              ? "text-moss"
              : aggregateR < 0
              ? "text-red-500"
              : "text-white/70")
          }
        >
          {totalClosed === 0
            ? "—"
            : (aggregateR >= 0 ? "+" : "") + aggregateR.toFixed(1) + "R"}
        </div>
      </div>
    </div>
  );
}
