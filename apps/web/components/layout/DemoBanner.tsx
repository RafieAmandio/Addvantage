import { isMockMode } from "@/lib/config/public";

export function DemoBanner() {
  if (!isMockMode()) return null;
  return (
    <div className="border-b border-brand/40 bg-brand/10 px-4 py-1.5 text-center font-mono text-[10px] uppercase tracking-widest2 text-brand">
      Demo mode — static fixtures, no live data. Covered: news · plan · watchlist · calendar.
    </div>
  );
}
