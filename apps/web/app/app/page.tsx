"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { news } from "@/features/news/mock";
import { calendar } from "@/features/calendar/mock";
import { CalendarPeekRow } from "@/features/calendar/components/CalendarPeekRow";
import { tradingPlans, getAllPlans } from "@/features/plan/mock";
import { channelPosts } from "@/features/channel/mock";
import { primers } from "@/features/education/mock";
import { consultSessions } from "@/features/consult/mock";
import { useAppState, isPaid } from "@/lib/state";
import { useReadPrimers } from "@/features/education/hooks/useReadPrimers";
import { useWatchlist } from "@/features/watchlist/hooks/useWatchlist";
import { useSeenNews } from "@/features/news/hooks/useSeenNews";
import { DataLabel, ImpactPill, BiasBadge } from "@/components/ui/Marker";
import { WatchPin } from "@/features/watchlist/components/WatchPin";
import { formatDate, formatTime } from "@/lib/cn";

const OPERATOR_ID = "U-00417";

function greeting(h: number) {
  if (h < 5) return "Late shift";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Night watch";
}

export default function HomePage() {
  const { tier, setSearchOpen, operatorName } = useAppState();
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
  // Featured primer = first unread accessible one, or fall back to first unlocked
  const accessiblePrimers = primers.filter((p) => !p.locked || paid);
  const featuredPrimer =
    accessiblePrimers.find((p) => !readIds.includes(p.id)) ??
    accessiblePrimers[0] ??
    primers[0];
  const channelTop = channelPosts[0];

  // Watchlist mentions — news + plan setups that touch any pinned ticker
  const watchNewsMentions = watchHydrated
    ? news.filter((n) => n.affects.some((a) => tickers.includes(a)))
    : [];
  const watchSetupMentions = watchHydrated
    ? plan.setups.filter((s) => tickers.includes(s.instrument))
    : [];

  // Historical setups on watched tickers, across all archived plans.
  // Used to surface "edge on my pins" — wins/losses specific to the user's
  // watchlist instruments. Ordered newest-first, capped at 6.
  const watchArchiveSetups = watchHydrated
    ? getAllPlans()
        .filter((p) => p.id !== plan.id) // exclude live plan
        .flatMap((p) =>
          p.setups
            .filter((s) => tickers.includes(s.instrument))
            .map((s) => ({ plan: p, setup: s }))
        )
        .slice(0, 6)
    : [];

  // Quick stats
  const highImpactToday = news.filter((n) => n.impact === "high").length;
  const highCalendar = calendar.filter((c) => c.impact === "high").length;
  const openSetups = plan.setups.length;

  return (
    <div className="bg-grid">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden border-b border-ink-3 bg-ink-2/30">
        <div className="absolute -right-24 -top-24 h-[24rem] w-[24rem] rounded-full bg-lime/10 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-6 py-12 lg:py-16">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8">
              <DataLabel>{stamp || "—"}</DataLabel>
              <h1 className="mt-3 font-display text-5xl leading-[0.95] text-paper sm:text-6xl lg:text-7xl">
                <span suppressHydrationWarning>{greet}</span>,
                <br />
                <span className="italic text-lime">{operatorName}</span>.
              </h1>
              <p className="mt-6 max-w-xl font-display text-xl text-paper/60">
                The DOMAIN has been transmitting overnight.{" "}
                <span className="text-paper">{highImpactToday}</span> high-impact
                items, <span className="text-paper">{openSetups}</span> open
                setups on the Trading Plan, and{" "}
                <span className="text-paper">{highCalendar}</span> high-impact
                events on the calendar in the next 48h.
              </p>

              {/* Big search bar */}
              <button
                onClick={() => setSearchOpen(true)}
                className="group mt-10 flex w-full max-w-xl items-center gap-4 border border-lime/40 bg-ink-2/60 px-5 py-4 text-left transition-colors hover:border-lime"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="shrink-0 text-lime"
                  aria-hidden
                >
                  <circle cx="9" cy="9" r="6" />
                  <path d="M14 14l4 4" strokeLinecap="round" />
                </svg>
                <span className="flex-1 truncate font-display text-lg italic text-paper/40 group-hover:text-paper/60">
                  Search news, plans, primers, channels…
                </span>
                <span className="hidden items-center gap-1 sm:flex">
                  <kbd className="border border-lime/30 bg-ink px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-lime">
                    {isMac ? "⌘" : "Ctrl"}
                  </kbd>
                  <kbd className="border border-lime/30 bg-ink px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-lime">
                    K
                  </kbd>
                </span>
              </button>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                <span>Try:</span>
                {["fed", "BBCA", "loss aversion", "drawdown", "USDIDR"].map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => setSearchOpen(true)}
                      className="border-b border-transparent text-paper/60 hover:border-lime hover:text-lime"
                    >
                      {s}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Operator card */}
            <aside className="col-span-12 lg:col-span-4">
              <div className="border border-ink-3 bg-ink/60 p-5">
                <div className="flex items-baseline justify-between">
                  <DataLabel>Operator</DataLabel>
                  <span
                    className={
                      "font-mono text-[9px] uppercase tracking-widest2 " +
                      (paid ? "text-moss" : "text-paper/40")
                    }
                  >
                    ● {paid ? "TIER 01" : "TIER 00"}
                  </span>
                </div>
                <NameField />
                <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                  {OPERATOR_ID} · {paid ? "VIP+ Trader" : "Free access"}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-px bg-ink-3">
                  <Stat label="High news" value={highImpactToday} />
                  <Stat label="Setups" value={openSetups} />
                  <Stat label="Cal · 48h" value={highCalendar} />
                </div>

                <Link
                  href="/app/brief"
                  className="mt-5 block border border-lime/60 py-2 text-center font-mono text-[10px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
                >
                  Open today's full brief →
                </Link>
                <Link
                  href="/app/subscription"
                  className="mt-2 block py-1 text-center font-mono text-[9px] uppercase tracking-widest2 text-paper/40 hover:text-lime"
                >
                  {paid ? "Manage subscription" : "Upgrade access"}
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ─── PILLAR SHORTCUTS ─── */}
      <section className="border-b border-ink-3">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <DataLabel>● Jump to</DataLabel>
          <div className="mt-4 grid grid-cols-2 gap-px bg-ink-3 sm:grid-cols-3 lg:grid-cols-6">
            <PillarTile code="TX-01" label="News" href="/app/news" hint="g n" />
            <PillarTile
              code="TX-02"
              label="Calendar"
              href="/app/calendar"
              hint="g c"
            />
            <PillarTile
              code="TX-03"
              label="Trading Plan"
              href="/app/plan"
              hint="g p"
              locked={!paid}
            />
            <PillarTile
              code="TX-04"
              label="Consultation"
              href="/app/consult"
              hint="g k"
              locked={!paid}
            />
            <PillarTile
              code="TX-05"
              label="Education"
              href="/app/education"
              hint="g e"
            />
            <PillarTile
              code="TX-06"
              label="My Channel"
              href="/app/channel"
              hint="g m"
            />
          </div>
        </div>
      </section>

      {/* ─── WATCHLIST ─── */}
      {watchHydrated && tickers.length > 0 && (
        <section className="border-b border-ink-3 bg-ink-2/20">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <Header
              n="—"
              label="WATCHLIST"
              right={`${tickers.length} pinned`}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                {tickers.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 border border-lime/40 bg-lime/5 py-0.5 pl-2 pr-1 font-mono text-[10px] uppercase tracking-widest2 text-lime"
                  >
                    {t}
                    <WatchPin ticker={t} />
                  </span>
                ))}
                <Link
                  href="/app/watchlist"
                  className="ml-2 font-mono text-[10px] uppercase tracking-widest2 text-lime hover:underline"
                >
                  Manage all →
                </Link>
              </div>
            </Header>

            <div className="mt-4 grid grid-cols-12 gap-6">
              {/* News mentioning watched tickers */}
              <div className="col-span-12 lg:col-span-7">
                <DataLabel>News touching your pins</DataLabel>
                {watchNewsMentions.length === 0 ? (
                  <div className="mt-3 border border-ink-3 bg-ink p-5 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                    ● Nothing in today's wire mentions{" "}
                    {tickers.map((t, i) => (
                      <span key={t} className="text-lime">
                        {i > 0 ? " · " : ""}
                        {t}
                      </span>
                    ))}
                    . The desk will ping you when it does.
                  </div>
                ) : (
                  <div className="mt-3 space-y-px bg-ink-3">
                    {watchNewsMentions.slice(0, 3).map((n) => {
                      const hits = n.affects.filter((a) => tickers.includes(a));
                      return (
                        <Link
                          key={n.id}
                          href={`/app/news/${n.id}`}
                          className="group block bg-ink p-4 transition-colors hover:bg-ink-2"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                              {n.id}
                            </span>
                            <ImpactPill level={n.impact} />
                            <BiasBadge bias={n.bias} />
                            <span className="ml-auto flex gap-1">
                              {hits.map((h) => (
                                <span
                                  key={h}
                                  className="border border-lime bg-lime/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-lime"
                                >
                                  ★ {h}
                                </span>
                              ))}
                            </span>
                          </div>
                          <div className="mt-2 font-display text-lg leading-snug text-paper transition-colors group-hover:text-lime">
                            {n.headline}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Trading plan setups on watched instruments */}
              <div className="col-span-12 lg:col-span-5">
                <DataLabel>Live setups on your pins</DataLabel>
                {watchSetupMentions.length === 0 ? (
                  <div className="mt-3 border border-ink-3 bg-ink p-5 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                    ● No setups on your pinned instruments in the current plan.
                  </div>
                ) : (
                  <div className="mt-3 space-y-px bg-ink-3">
                    {watchSetupMentions.map((s) => (
                      <Link
                        key={s.id}
                        href={`/app/plan/${plan.id}#${s.id}`}
                        className="group block bg-ink p-4 transition-colors hover:bg-ink-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                            {s.id}
                          </span>
                          <span
                            className={
                              "font-mono text-[10px] uppercase tracking-widest2 " +
                              (s.direction === "long" ? "text-moss" : "text-lime")
                            }
                          >
                            ★ {s.instrument} · {s.direction}
                          </span>
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-paper/70">
                          Entry <span className="text-paper">{s.entry}</span> · Stop{" "}
                          <span className="text-blood">{s.stop}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {watchArchiveSetups.length > 0 && (
                  <div className="mt-6">
                    <DataLabel>Edge on your pins · archive</DataLabel>
                    <div className="mt-3 space-y-px bg-ink-3">
                      {watchArchiveSetups.map(({ plan: p, setup: s }) => {
                        const outcome = s.outcome ?? "open";
                        const isWin = outcome === "win";
                        const isLoss = outcome === "loss" || outcome === "stopped";
                        return (
                          <Link
                            key={`${p.id}-${s.id}`}
                            href={`/app/plan/${p.id}#${s.id}`}
                            className="group block bg-ink p-3 transition-colors hover:bg-ink-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] uppercase tracking-widest2 text-paper/50">
                                    {p.id} · {s.id}
                                  </span>
                                  <span
                                    className={
                                      "font-mono text-[10px] uppercase tracking-widest2 " +
                                      (s.direction === "long"
                                        ? "text-moss"
                                        : "text-lime")
                                    }
                                  >
                                    ★ {s.instrument}
                                  </span>
                                </div>
                                <div className="mt-0.5 truncate font-mono text-[10px] text-paper/50">
                                  {s.rationale}
                                </div>
                              </div>
                              {s.outcomeR && (
                                <div
                                  className={
                                    "shrink-0 font-display text-lg " +
                                    (isWin
                                      ? "text-moss"
                                      : isLoss
                                      ? "text-blood"
                                      : "text-paper/60")
                                  }
                                >
                                  {s.outcomeR}
                                </div>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── FEATURED ROW ─── */}
      <section className="border-b border-ink-3">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-12 gap-6">
            {/* Featured news */}
            <div className="col-span-12 lg:col-span-8">
              <Header n="01 /" label="Top of the wire" right="3 most-impact items">
                <Link
                  href="/app/news"
                  className="font-mono text-[10px] uppercase tracking-widest2 text-lime hover:underline"
                >
                  Full feed →
                </Link>
              </Header>
              <div className="mt-4 space-y-px bg-ink-3">
                {topNews.map((n) => {
                  const seen = seenHydrated && seenNewsIds.includes(n.id);
                  return (
                  <Link
                    key={n.id}
                    href={`/app/news/${n.id}`}
                    className={
                      "group block bg-ink p-5 transition-colors hover:bg-ink-2 " +
                      (seen ? "opacity-60 hover:opacity-100" : "")
                    }
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                        {n.id}
                      </span>
                      <ImpactPill level={n.impact} />
                      <BiasBadge bias={n.bias} />
                      {seen && (
                        <span className="font-mono text-[8px] uppercase tracking-widest2 text-paper/40">
                          ✓ SEEN
                        </span>
                      )}
                      <span className="ml-auto font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                        {formatTime(n.ts)}Z · BY {n.author.toUpperCase()}
                      </span>
                    </div>
                    <h3
                      className={
                        "mt-3 font-display text-2xl leading-snug transition-colors group-hover:text-lime " +
                        (seen ? "text-paper/70" : "text-paper")
                      }
                    >
                      {n.headline}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-paper/60">
                      {n.analysis}
                    </p>
                  </Link>
                  );
                })}
              </div>
            </div>

            {/* Right rail */}
            <aside className="col-span-12 space-y-8 lg:col-span-4">
              {/* Plan */}
              <div className="border border-lime/40 bg-ink-2/30 p-5 scanline">
                <div className="flex items-center justify-between">
                  <DataLabel>Trading Plan · TX-03</DataLabel>
                  {paid ? (
                    <span className="font-mono text-[9px] uppercase tracking-widest2 text-moss">
                      ○ UNLOCKED
                    </span>
                  ) : (
                    <span className="font-mono text-[9px] uppercase tracking-widest2 text-blood">
                      ● LOCKED
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-display text-2xl text-paper">
                  {paid
                    ? plan.thesis.slice(0, 100) + "…"
                    : "Macro is repricing the cut path. Four setups live."}
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  {plan.setups.map((s) => (
                    <div key={s.id} className="border border-ink-3 bg-ink p-2">
                      <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                        {s.instrument}
                      </div>
                      <div
                        className={
                          "font-display text-sm " +
                          (s.direction === "long" ? "text-moss" : "text-lime")
                        }
                      >
                        {s.direction === "long" ? "LONG" : "SHORT"}
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/app/plan"
                  className="mt-4 block border border-lime/60 py-2 text-center font-mono text-[10px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
                >
                  {paid ? "Open plan →" : "Unlock plan →"}
                </Link>
              </div>

              {/* Calendar peek */}
              <div>
                <Header n="02 /" label="Calendar · 48h">
                  <Link
                    href="/app/calendar"
                    className="font-mono text-[10px] uppercase tracking-widest2 text-lime hover:underline"
                  >
                    Full →
                  </Link>
                </Header>
                <div className="mt-4 space-y-px bg-ink-3">
                  {upcoming.map((c) => (
                    <CalendarPeekRow key={c.id} event={c} />
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ─── EDUCATION + CONSULTATION + CHANNEL ─── */}
      <section className="border-b border-ink-3 bg-ink-2/20">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-12 gap-6">
            {/* Featured primer */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <Header n="03 /" label="Primer of the day" />
              <Link
                href={`/app/education/${featuredPrimer.id}`}
                className="mt-4 block border border-ink-3 bg-ink p-6 transition-colors hover:border-lime/40 hover:bg-ink-2"
              >
                <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                  {featuredPrimer.id} · {featuredPrimer.readingMin} min
                </div>
                <h3 className="mt-3 font-display text-3xl leading-tight text-paper">
                  {featuredPrimer.title}
                </h3>
                <div className="mt-1 font-mono text-[10px] italic text-lime/70">
                  {featuredPrimer.framework}
                </div>
                <p className="mt-4 text-sm text-paper/70">
                  {featuredPrimer.summary}
                </p>
                <div className="mt-4 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                  Read primer →
                </div>
              </Link>
            </div>

            {/* Recent consult */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <Header n="04 /" label="Last consultation" />
              <Link
                href="/app/consult"
                className="mt-4 block border border-ink-3 bg-ink p-6 transition-colors hover:border-lime/40 hover:bg-ink-2"
              >
                <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                  {recentSession.id} · {recentSession.messages.length} messages
                </div>
                <h3 className="mt-3 font-display text-2xl leading-snug text-paper">
                  {recentSession.title}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {recentSession.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="font-mono text-[9px] uppercase tracking-widest2 text-lime/60"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
                <p className="mt-4 line-clamp-3 text-sm text-paper/60">
                  {recentSession.messages[recentSession.messages.length - 1]
                    ?.body}
                </p>
                <div className="mt-4 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                  {paid ? "Open session →" : "Locked · upgrade to read →"}
                </div>
              </Link>
            </div>

            {/* Channel */}
            <div className="col-span-12 lg:col-span-4">
              <Header n="05 /" label="From the channel">
                <Link
                  href="/app/channel"
                  className="font-mono text-[10px] uppercase tracking-widest2 text-lime hover:underline"
                >
                  All →
                </Link>
              </Header>
              <Link
                href="/app/channel"
                className="mt-4 block border border-ink-3 bg-ink p-6 transition-colors hover:border-lime/40 hover:bg-ink-2"
              >
                <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                  {channelTop.id} · BY {channelTop.author.toUpperCase()}
                </div>
                <p className="mt-4 font-display text-lg leading-snug text-paper">
                  {channelTop.body}
                </p>
                <div className="mt-4 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                  {formatDate(channelTop.ts)} · {formatTime(channelTop.ts)}Z
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER NOTE ─── */}
      <div className="mx-auto max-w-7xl px-6 py-8 text-center font-mono text-[9px] uppercase tracking-widest2 text-paper/30">
        ANTS // DOMAIN // OPERATOR HOME · Press ⌘K or / to search · Press ? for shortcuts
      </div>
    </div>
  );
}

function NameField() {
  const { operatorName, setOperatorName } = useAppState();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(operatorName);

  useEffect(() => {
    setDraft(operatorName);
  }, [operatorName]);

  const commit = () => {
    const v = draft.trim();
    setOperatorName(v.length > 0 ? v : "Operator");
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(operatorName);
            setEditing(false);
          }
        }}
        className="mt-2 w-full border-b-2 border-lime bg-transparent font-display text-2xl text-lime outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Click to rename"
      className="group mt-2 block w-full text-left font-display text-2xl text-paper transition-colors hover:text-lime"
    >
      {operatorName}
      <span className="ml-2 font-mono text-[9px] uppercase tracking-widest2 text-paper/30 opacity-0 transition-opacity group-hover:opacity-100">
        ✎ rename
      </span>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-ink p-3 text-center">
      <div className="font-display text-3xl text-lime">{value}</div>
      <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
        {label}
      </div>
    </div>
  );
}

function PillarTile({
  code,
  label,
  href,
  hint,
  locked,
}: {
  code: string;
  label: string;
  href: string;
  hint: string;
  locked?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between bg-ink p-4 transition-colors hover:bg-ink-2"
    >
      <div>
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-lime">
          {code}
        </div>
        <div className="mt-1 font-display text-lg text-paper transition-colors group-hover:text-lime">
          {label}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <kbd className="border border-ink-3 bg-ink-2 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest2 text-paper/40">
          {hint}
        </kbd>
        {locked && (
          <span className="font-mono text-[8px] uppercase tracking-widest2 text-blood">
            LOCKED
          </span>
        )}
      </div>
    </Link>
  );
}

function Header({
  n,
  label,
  right,
  children,
}: {
  n: string;
  label: string;
  right?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-widest2 text-lime">
        <span>{n}</span>
        <span className="h-px w-6 bg-lime/30" />
        <span className="text-paper/60">{label}</span>
        {right && <span className="text-paper/30">· {right}</span>}
      </div>
      {children}
    </div>
  );
}
