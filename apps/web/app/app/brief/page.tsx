"use client";

import Link from "next/link";
import { useState } from "react";
import { news } from "@/lib/mock/news";
import { calendar } from "@/lib/mock/calendar";
import { tradingPlans } from "@/lib/mock/plans";
import { channelPosts } from "@/lib/mock/channel";
import { useAppState, isPaid } from "@/lib/state";
import { useSeenNews } from "@/lib/seenNews";
import {
  SectionNumber,
  DataLabel,
  ImpactPill,
  BiasBadge,
} from "@/components/ui/Marker";
import { CalendarPeekRow } from "@/components/ui/CalendarPeekRow";
import { formatTime, formatDate } from "@/lib/cn";

export default function BriefPage() {
  const { tier } = useAppState();
  const paid = isPaid(tier);
  const { ids: seenIds, hydrated: seenHydrated } = useSeenNews();
  const [hideSeen, setHideSeen] = useState(false);
  const plan = tradingPlans[0];
  const upcoming = calendar.slice(0, 4);
  const topNewsFull = news.slice(0, 4);
  const topNews =
    hideSeen && seenHydrated
      ? topNewsFull.filter((n) => !seenIds.includes(n.id))
      : topNewsFull;
  const seenInTop = seenHydrated
    ? topNewsFull.filter((n) => seenIds.includes(n.id)).length
    : 0;

  return (
    <div className="bg-grid">
      {/* Hero strip */}
      <div className="border-b border-ink-3 bg-ink-2/30">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex items-baseline justify-between">
            <div>
              <DataLabel>Brief 088 · {formatDate(news[0].ts)}</DataLabel>
              <h1 className="mt-2 font-display text-5xl leading-none text-paper lg:text-6xl">
                Today's <span className="italic text-lime">DOMAIN</span>
              </h1>
            </div>
            <div className="hidden text-right font-mono text-[10px] uppercase tracking-widest2 text-paper/40 sm:block">
              <div>Operators on watch · 4</div>
              <div>News tonight · {news.length}</div>
              <div>Open setups · {plan.setups.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 p-6">
        {/* News column */}
        <section className="col-span-12 lg:col-span-8">
          <div className="flex items-center justify-between">
            <SectionNumber n="01 /" label="LIVE NEWS" />
            {seenInTop > 0 && (
              <button
                onClick={() => setHideSeen((v) => !v)}
                className={
                  "border px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 transition-colors " +
                  (hideSeen
                    ? "border-lime bg-lime/10 text-lime"
                    : "border-ink-3 text-paper/60 hover:border-lime hover:text-lime")
                }
              >
                {hideSeen ? `✓ HIDING ${seenInTop} SEEN` : `HIDE ${seenInTop} SEEN`}
              </button>
            )}
          </div>
          <div className="mt-4 space-y-px bg-ink-3">
            {topNews.map((n) => {
              const seen = seenHydrated && seenIds.includes(n.id);
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
                <p className="mt-2 text-sm text-paper/70">{n.analysis}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {n.affects.map((a) => (
                    <span
                      key={a}
                      className="border border-paper/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/60"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </Link>
              );
            })}
          </div>
          <Link
            href="/app/news"
            className="mt-4 inline-flex font-mono text-[10px] uppercase tracking-widest2 text-lime hover:underline"
          >
            FULL FEED →
          </Link>
        </section>

        {/* Right column */}
        <aside className="col-span-12 space-y-8 lg:col-span-4">
          {/* Trading plan teaser */}
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
              {paid ? plan.thesis.slice(0, 100) + "…" : "Bias is repricing the cut path. Three setups live."}
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              {plan.setups.map((s) => (
                <div
                  key={s.id}
                  className="border border-ink-3 bg-ink p-2"
                >
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
            <SectionNumber n="02 /" label="CALENDAR · 48H" />
            <div className="mt-4 space-y-px bg-ink-3">
              {upcoming.map((c) => (
                <CalendarPeekRow key={c.id} event={c} />
              ))}
            </div>
          </div>

          {/* Channel */}
          <div>
            <SectionNumber n="03 /" label="MY CHANNEL" />
            <div className="mt-4 border border-ink-3 bg-ink p-4">
              <div className="font-mono text-[9px] uppercase tracking-widest2 text-lime">
                {channelPosts[0].id} · {formatTime(channelPosts[0].ts)}Z
              </div>
              <p className="mt-2 text-sm text-paper/80">
                {channelPosts[0].body}
              </p>
              <Link
                href="/app/channel"
                className="mt-3 inline-block font-mono text-[10px] uppercase tracking-widest2 text-lime hover:underline"
              >
                MORE FROM CHANNEL →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
