"use client";

import { useMemo, useEffect, useState } from "react";
import { dbPlanToTradingPlan } from "@/features/plan/lib/adapt";
import { useAppState, isPaid } from "@/lib/state";
import { useWatchlist } from "@/features/watchlist/hooks/useWatchlist";
import { useSeenNews } from "@/features/news/hooks/useSeenNews";
import { greeting } from "@/features/dashboard/lib/greeting";
import {
  collectWatchArchiveSetups,
  filterNewsByWatch,
  filterSetupsByWatch,
} from "@/features/dashboard/lib/watchlist-mentions";
import { WatchlistSection } from "@/features/dashboard/components/WatchlistSection";
import { BulletinSection } from "@/features/bulletin/components/BulletinSection";
import { PriceStrip } from "@/features/dashboard/components/PriceStrip";
import { ConsensusHero, type ConsensusMarket } from "@/features/dashboard/components/ConsensusHero";
import { PlanCard } from "@/features/dashboard/components/PlanCard";
import { CalendarPanel } from "@/features/dashboard/components/CalendarPanel";
import { RangePanel } from "@/features/dashboard/components/RangePanel";
import { NewsPanel } from "@/features/dashboard/components/NewsPanel";
import type { NewsListItem } from "@/features/news/queries/news";
import type { Plan } from "@/features/plan/types";
import type { Bulletin } from "@/features/bulletin/types";
import type { AtrScannerData } from "@/features/atr/types";
import type { CalendarEvent } from "@/features/calendar/types";
import type { MacroData } from "@/features/macro/types";

interface Props {
  news: NewsListItem[];
  plans: Plan[];
  bulletins: Bulletin[];
  consensus: ConsensusMarket[];
  atr: AtrScannerData;
  calendar: CalendarEvent[];
  macro: MacroData;
}

export function DashboardClient({ news, plans, bulletins, consensus, atr, calendar, macro }: Props) {
  const { tier, operatorName } = useAppState();
  const paid = isPaid(tier);
  const { ids: seenNewsIds, hydrated: seenHydrated } = useSeenNews();
  const { tickers, hydrated: watchHydrated } = useWatchlist();
  const [hour, setHour] = useState<number | null>(null);
  const [stamp, setStamp] = useState("");

  useEffect(() => {
    const d = new Date();
    setHour(d.getHours());
    setStamp(
      d.toLocaleString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    );
  }, []);

  const greet = hour === null ? "Welcome" : greeting(hour);

  const allTradingPlans = useMemo(
    () => plans.map(dbPlanToTradingPlan),
    [plans],
  );

  const plan = allTradingPlans[0] ?? null;

  const watchNewsMentions = useMemo(
    () => (watchHydrated ? filterNewsByWatch(news, tickers) : []),
    [watchHydrated, news, tickers],
  );
  const watchSetupMentions = useMemo(
    () => (watchHydrated && plan ? filterSetupsByWatch(plan.setups, tickers) : []),
    [watchHydrated, plan, tickers],
  );
  const watchArchiveSetups = useMemo(
    () => (watchHydrated ? collectWatchArchiveSetups(allTradingPlans, tickers, plan?.id ?? "") : []),
    [watchHydrated, allTradingPlans, tickers, plan?.id],
  );

  const highImpactToday = useMemo(
    () => news.filter((n) => n.impact === "high").length,
    [news],
  );
  const openSetups = plan?.setups.length ?? 0;

  return (
    <div className="flex flex-col gap-4 px-4 pb-10 sm:px-6">
      <div className="enter flex flex-wrap items-end justify-between gap-x-6 gap-y-2 pt-1">
        <p className="font-num text-[30px] font-semibold leading-8 text-white">
          {greet}, <span className="text-brand">{operatorName}</span>
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 whitespace-nowrap text-[13px] text-white/55">
          {stamp && <span>{stamp}</span>}
          <span><b className="font-semibold text-white">{highImpactToday}</b> high-impact items</span>
          <span><b className="font-semibold text-white">{openSetups}</b> open setups</span>
        </div>
      </div>

      <div className="enter" style={{ "--i": 1 } as React.CSSProperties}>
        <PriceStrip pairs={atr.pairs} updatedAt={atr.updatedAt} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="enter min-w-0 lg:col-span-2" style={{ "--i": 2 } as React.CSSProperties}>
          <ConsensusHero markets={consensus} macro={macro} pairs={atr.pairs} />
        </div>
        <div className="enter flex min-w-0 flex-col" style={{ "--i": 3 } as React.CSSProperties}>
          <PlanCard plan={plan} paid={paid} />
        </div>
      </div>

      {/* Two columns that stack on phones in reading order. News runs longer when there is no bulletin so the left column keeps pace with the right. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="enter flex min-w-0 flex-col gap-4 lg:col-span-2" style={{ "--i": 4 } as React.CSSProperties}>
          <BulletinSection bulletins={bulletins} />
          <NewsPanel
            news={news}
            seen={seenHydrated ? new Set(seenNewsIds) : new Set()}
            limit={bulletins.length > 0 ? 10 : 14}
            className="flex-1"
          />
        </div>
        <div className="enter flex min-w-0 flex-col gap-4" style={{ "--i": 5 } as React.CSSProperties}>
          <CalendarPanel events={calendar} />
          <RangePanel pairs={atr.pairs} />
          <WatchlistSection
            tickers={tickers}
            pairs={atr.pairs}
            watchHydrated={watchHydrated}
            watchNewsMentions={watchNewsMentions}
            watchSetupMentions={watchSetupMentions}
            watchArchiveSetups={watchArchiveSetups}
            planId={plan?.id ?? null}
          />
        </div>
      </div>
    </div>
  );
}
