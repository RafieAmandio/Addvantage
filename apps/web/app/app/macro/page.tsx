import type { Metadata } from "next";
import { apiGet } from "@/lib/api/client-server";
import { getMacro } from "@/features/macro/queries";
import { currencyStrength } from "@/features/macro/lib/macro";
import { BankCard, FxMatrix, MarketTiles, RiskCard, SectionTitle, StrengthCard } from "@/features/macro/components/MacroPanels";
import { MacroCalendar, YieldsCard } from "@/features/macro/components/MacroInteractive";
import { listBars } from "@/features/chart/queries/bars";
import { listTimelineEvents } from "@/features/timeline/queries/timeline";
import { timelineEventToCalendarEvent } from "@/features/calendar/lib/fromTimeline";
import { CURRENCIES } from "@/features/macro/types";
import type { AtrScannerData } from "@/features/atr/types";

export const metadata: Metadata = { title: "Macro" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

function synced(iso: string | null) {
  if (!iso) return "Macro data not synced yet";
  return `Data synced ${new Date(iso).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })} WIB`;
}

export default async function MacroPage() {
  const now = Date.now();
  const [macro, atr, events] = await Promise.all([
    getMacro(),
    apiGet<AtrScannerData>("/atr/scanner").catch(() => ({ updatedAt: null, pairs: [] }) as AtrScannerData),
    listTimelineEvents({ kinds: ["macro"], from: new Date(now - 6 * 3600_000).toISOString(), to: new Date(now + 14 * 86_400_000).toISOString(), limit: 300 }).catch(() => []),
  ]);

  // Sparklines for the market tiles: last 60 daily closes where bars are stored.
  const tilePairs = atr.pairs.filter((p) => p.group === "commodity" || p.group === "index");
  const sparks = Object.fromEntries(
    await Promise.all(
      tilePairs.map(async (p) => {
        const bars = await listBars({ symbol: p.symbol, interval: "1d", from: new Date(now - 90 * 86_400_000), to: new Date(now) });
        return [p.symbol, bars.map((b) => b.close).filter((c): c is number => c !== null).slice(-60)] as const;
      }),
    ),
  );

  const curve = macro.usCurve ? macro.usCurve.y10 - macro.usCurve.y2 : null;
  const banks = CURRENCIES.filter((c) => macro.banks[c]);

  return (
    <div className="space-y-4 px-4 pb-10 sm:px-6">
      <div className="flex flex-wrap gap-2 text-[12px] font-medium">
        <span className="rounded-full border border-white/[0.12] px-3 py-1 text-white/55">{synced(macro.syncedAt)}</span>
        {curve !== null && (
          <span className={curve >= 0 ? "rounded-full bg-up/15 px-3 py-1 text-up" : "rounded-full bg-down/15 px-3 py-1 text-down"}>
            US curve {curve >= 0 ? "positive" : "inverted"}: 2s10s {curve >= 0 ? "+" : ""}
            {(curve * 100).toFixed(0)}bp
          </span>
        )}
      </div>

      <SectionTitle>Central bank policy rates</SectionTitle>
      {banks.length === 0 ? (
        <p className="text-[14px] text-white/40">No policy data yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {banks.map((c) => (
            <BankCard key={c} ccy={c} bank={macro.banks[c]!} />
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <StrengthCard strength={currencyStrength(atr.pairs)} />
        <YieldsCard data={macro} />
        <RiskCard risk={macro.risk} />
      </div>

      <SectionTitle>Commodities and indices</SectionTitle>
      <MarketTiles pairs={atr.pairs} sparks={sparks} />

      <FxMatrix pairs={atr.pairs} />

      <MacroCalendar events={events.map(timelineEventToCalendarEvent)} />
    </div>
  );
}
