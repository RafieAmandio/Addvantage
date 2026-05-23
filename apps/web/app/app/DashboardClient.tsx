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
import { PredictionGrid } from "@/features/predictions/components/PredictionGrid";
import { CalendarStrip } from "@/features/dashboard/components/CalendarStrip";
import { ActivePlanSection } from "@/features/dashboard/components/ActivePlanSection";
import { WatchlistSection } from "@/features/dashboard/components/WatchlistSection";
import { NewsRows } from "@/features/dashboard/components/NewsRows";
import type { NewsListItem } from "@/features/news/queries/news";
import type { Plan } from "@/features/plan/types";
import type { PredictionCardData } from "@/features/predictions/types";

interface Props {
  news: NewsListItem[];
  plans: Plan[];
  predictions: PredictionCardData[];
}

export function DashboardClient({ news, plans, predictions }: Props) {
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
      <DashboardHero
        stamp={stamp}
        greet={greet}
        operatorName={operatorName}
        highImpactToday={highImpactToday}
        openSetups={openSetups}
      />

      <PredictionGrid
        predictions={predictions.length > 0 ? predictions : null}
        className="py-5"
      />

      <CalendarStrip />

      <ActivePlanSection plan={plan} paid={paid} />

      <WatchlistSection
        tickers={tickers}
        watchHydrated={watchHydrated}
        watchNewsMentions={watchNewsMentions}
        watchSetupMentions={watchSetupMentions}
        watchArchiveSetups={watchArchiveSetups}
        planId={plan?.id ?? null}
      />

      <NewsRows
        news={news}
        seenNewsIds={seenNewsIds}
        seenHydrated={seenHydrated}
      />
    </div>
  );
}
