import { isMockMode } from "@/lib/config/public";

/**
 * Sticky "demo mode" ribbon shown across the dashboard when
 * `NEXT_PUBLIC_MOCK_MODE=1`. Static fixture-backed pages are: news, plan,
 * watchlist, calendar. Other surfaces will show empty states.
 */
export function DemoBanner() {
  if (!isMockMode()) return null;
  return (
    <div className="border-b border-lime/40 bg-lime/10 px-4 py-1.5 text-center font-mono text-[10px] uppercase tracking-widest2 text-lime">
      Demo mode — static fixtures, no live data. Covered: news · plan · watchlist · calendar.
    </div>
  );
}
