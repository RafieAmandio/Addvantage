"use client";

import { useEffect, useState } from "react";
import { news } from "@/features/news/mock";
import { calendar } from "@/features/calendar/mock";
import { tradingPlans, getAllPlans } from "@/features/plan/mock";
import { channelPosts } from "@/features/channel/mock";
import { primers } from "@/features/education/mock";
import { consultSessions } from "@/features/consult/mock";
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

export default function HomePage() {
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
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  const greet = hour === null ? "Welcome" : greeting(hour);

  const topNews = news.slice(0, 3);
  const plan = tradingPlans[0];
  const upcoming = calendar.slice(0, 3);
  const recentSession = consultSessions[0];
  const featuredPrimer = pickFeaturedPrimer(primers, readIds, paid);
  const channelTop = channelPosts[0];

  // Watchlist mentions — news + plan setups that touch any pinned ticker
  const watchNewsMentions = watchHydrated
    ? filterNewsByWatch(news, tickers)
    : [];
  const watchSetupMentions = watchHydrated
    ? filterSetupsByWatch(plan.setups, tickers)
    : [];

  // Historical setups on watched tickers, across all archived plans.
  // Used to surface "edge on my pins" — wins/losses specific to the user's
  // watchlist instruments. Ordered newest-first, capped at 6.
  const watchArchiveSetups = watchHydrated
    ? collectWatchArchiveSetups(getAllPlans(), tickers, plan.id)
    : [];

  // Quick stats
  const highImpactToday = news.filter((n) => n.impact === "high").length;
  const highCalendar = calendar.filter((c) => c.impact === "high").length;
  const openSetups = plan.setups.length;

  return (
    <div className="bg-grid">
      <div className="stagger">
        <DashboardHero
          stamp={stamp}
          greet={greet}
          operatorName={operatorName}
          paid={paid}
          isMac={isMac}
          highImpactToday={highImpactToday}
          openSetups={openSetups}
          highCalendar={highCalendar}
        />

        <PillarShortcuts paid={paid} />

        {watchHydrated && tickers.length > 0 && (
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
          upcoming={upcoming}
        />

        <DiscoveryRow
          featuredPrimer={featuredPrimer}
          recentSession={recentSession}
          paid={paid}
          channelTop={channelTop}
        />
      </div>

      {/* ─── FOOTER NOTE ─── */}
      <div className="mx-auto max-w-7xl px-4 py-6 text-center font-mono text-[9px] uppercase tracking-widest2 text-white/30 animate-[revealUp_0.6s_ease-out_both] sm:px-6 sm:py-8">
        ANTS // DOMAIN // OPERATOR HOME<span className="hidden sm:inline"> · Press ⌘K or / to search · Press ? for shortcuts</span>
      </div>
    </div>
  );
}
