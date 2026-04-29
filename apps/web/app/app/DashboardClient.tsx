"use client";

import { useMemo, useEffect, useState } from "react";
import { dbPlanToTradingPlan } from "@/features/plan/lib/adapt";
import { useAppState, isPaid } from "@/lib/state";
import { useReadPrimers } from "@/features/education/hooks/useReadPrimers";
import { useWatchlist } from "@/features/watchlist/hooks/useWatchlist";
import { useSeenNews } from "@/features/news/hooks/useSeenNews";
import { greeting } from "@/features/dashboard/lib/greeting";
import {
  collectWatchArchiveSetups,
  filterNewsByWatch,
  filterSetupsByWatch,
} from "@/features/dashboard/lib/watchlist-mentions";
import { pickFeaturedPrimer } from "@/features/dashboard/lib/featured";
import { DashboardHero } from "@/features/dashboard/components/DashboardHero";
import { PillarShortcuts } from "@/features/dashboard/components/PillarShortcuts";
import { WatchlistSection } from "@/features/dashboard/components/WatchlistSection";
import { FeaturedRow } from "@/features/dashboard/components/FeaturedRow";
import { DiscoveryRow } from "@/features/dashboard/components/DiscoveryRow";
import type { NewsListItem } from "@/features/news/queries/news";
import type { Primer } from "@/features/education/types";
import type { Plan } from "@/features/plan/types";

interface Props {
  news: NewsListItem[];
  primers: Primer[];
  plans: Plan[];
}

export function DashboardClient({ news, primers, plans }: Props) {
  const { tier, operatorName } = useAppState();
  const paid = isPaid(tier);
  const { ids: readIds } = useReadPrimers();
  const { ids: seenNewsIds, hydrated: seenHydrated } = useSeenNews();
  const { tickers, hydrated: watchHydrated } = useWatchlist();
  const [hour, setHour] = useState<number | null>(null);
  const [stamp, setStamp] = useState("");
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const d = new Date();
    setHour(d.getHours());
    setStamp(
      d.toLocaleString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    );
    setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  const greet = hour === null ? "Welcome" : greeting(hour);

  const allTradingPlans = useMemo(
    () => plans.map(dbPlanToTradingPlan),
    [plans],
  );

  const topNews = news.slice(0, 3);
  const plan = allTradingPlans[0] ?? null;
  const featuredPrimer = pickFeaturedPrimer(primers, readIds, paid);

  const watchNewsMentions = watchHydrated
    ? filterNewsByWatch(news, tickers)
    : [];
  const watchSetupMentions =
    watchHydrated && plan
      ? filterSetupsByWatch(plan.setups, tickers)
      : [];

  const watchArchiveSetups = watchHydrated
    ? collectWatchArchiveSetups(allTradingPlans, tickers, plan?.id ?? "")
    : [];

  const highImpactToday = news.filter((n) => n.impact === "high").length;
  const openSetups = plan?.setups.length ?? 0;

  return (
    <div>
      <div className="stagger">
        <DashboardHero
          stamp={stamp}
          greet={greet}
          operatorName={operatorName}
          paid={paid}
          isMac={isMac}
          highImpactToday={highImpactToday}
          openSetups={openSetups}
        />

        <PillarShortcuts paid={paid} />

        {watchHydrated && tickers.length > 0 && plan && (
          <WatchlistSection
            tickers={tickers}
            watchNewsMentions={watchNewsMentions}
            watchSetupMentions={watchSetupMentions}
            watchArchiveSetups={watchArchiveSetups}
            planId={plan.id}
          />
        )}

        <FeaturedRow
          topNews={topNews}
          seenNewsIds={seenNewsIds}
          seenHydrated={seenHydrated}
          plan={plan}
          paid={paid}
        />

        {featuredPrimer && (
          <DiscoveryRow
            featuredPrimer={featuredPrimer}
            paid={paid}
          />
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-white/20 animate-[revealUp_0.6s_ease-out_both] sm:px-6 sm:py-8">
        <span className="hidden sm:inline">Press {isMac ? "⌘" : "Ctrl+"}K to search · ? for shortcuts</span>
      </div>
    </div>
  );
}
