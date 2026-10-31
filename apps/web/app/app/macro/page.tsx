import type { Metadata } from "next";
import { apiGet } from "@/lib/api/client-server";
import { getMacro } from "@/features/macro/queries";
import { currencyStrength } from "@/features/macro/lib/macro";
import { CentralBanksPanel, RateGapsPanel, RiskPanel, StrengthPanel, YieldsPanel } from "@/features/macro/components/MacroPanels";
import { CalendarPanel } from "@/features/dashboard/components/CalendarPanel";
import { listTimelineEvents } from "@/features/timeline/queries/timeline";
import { timelineEventToCalendarEvent } from "@/features/calendar/lib/fromTimeline";
import type { AtrScannerData } from "@/features/atr/types";

export const metadata: Metadata = { title: "Macro" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

function ago(iso: string | null) {
  if (!iso) return "not synced yet";
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  return h < 1 ? "updated just now" : h < 48 ? `updated ${h}h ago` : `updated ${Math.round(h / 24)}d ago`;
}

export default async function MacroPage() {
  const now = Date.now();
  const [macro, atr, events] = await Promise.all([
    getMacro(),
    apiGet<AtrScannerData>("/atr/scanner").catch(() => ({ updatedAt: null, pairs: [] }) as AtrScannerData),
    listTimelineEvents({ kinds: ["macro"], from: new Date(now).toISOString(), to: new Date(now + 7 * 86_400_000).toISOString(), limit: 200 }).catch(() => []),
  ]);
  const calendar = events
    .map(timelineEventToCalendarEvent)
    .filter((e) => e.impact === "high")
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .slice(0, 6);

  return (
    <div className="space-y-4 px-4 pb-10 sm:px-6">
      <p className="text-[13px] text-white/40">
        Policy rates from BIS, yields and spreads from FRED, odds from Polymarket, volatility from Yahoo · {ago(macro.syncedAt)}
      </p>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          <CentralBanksPanel banks={macro.banks} />
          <div className="grid gap-4 md:grid-cols-2">
            <RateGapsPanel data={macro} />
            <YieldsPanel data={macro} />
          </div>
        </div>
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
          <StrengthPanel strength={currencyStrength(atr.pairs)} />
          <RiskPanel risk={macro.risk} />
          <CalendarPanel events={calendar} sub="High impact releases in the next 7 days, WIB" />
        </aside>
      </div>
    </div>
  );
}
