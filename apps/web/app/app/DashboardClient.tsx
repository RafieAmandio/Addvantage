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
import { DashboardHero } from "@/features/dashboard/components/DashboardHero";
import { DashboardEventChart } from "@/features/dashboard/components/DashboardEventChart";
import { CalendarStrip } from "@/features/dashboard/components/CalendarStrip";
import { ActivePlanSection } from "@/features/dashboard/components/ActivePlanSection";
import { WatchlistSection } from "@/features/dashboard/components/WatchlistSection";
import { NewsRows } from "@/features/dashboard/components/NewsRows";
import type { NewsListItem } from "@/features/news/queries/news";
import type { Plan } from "@/features/plan/types";

interface Props {
  news: NewsListItem[];
  plans: Plan[];
}

export function DashboardClient({ news, plans }: Props) {
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
    <div className="stagger">
      {/* Hero: tight top, greeting bar */}
      <DashboardHero
        stamp={stamp}
        greet={greet}
        operatorName={operatorName}
        highImpactToday={highImpactToday}
        openSetups={openSetups}
      />

      {/* Chart + Calendar: grouped visually (chart has own padding) */}
      <DashboardEventChart />
      <CalendarStrip />

      {/* Plan: primary content, most generous spacing */}
      <ActivePlanSection plan={plan} paid={paid} />

      {/* Watchlist: secondary, tighter */}
      <WatchlistSection
        tickers={tickers}
        watchHydrated={watchHydrated}
        watchNewsMentions={watchNewsMentions}
        watchSetupMentions={watchSetupMentions}
        watchArchiveSetups={watchArchiveSetups}
        planId={plan?.id ?? null}
      />

      {/* News: dense rows, tightest data section */}
      <NewsRows
        news={news}
        seenNewsIds={seenNewsIds}
        seenHydrated={seenHydrated}
      />
    </div>
  );
}
