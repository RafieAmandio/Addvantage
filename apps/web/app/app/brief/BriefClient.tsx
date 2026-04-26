"use client";

import Link from "next/link";
import { useState } from "react";
import { tradingPlans } from "@/features/plan/mock";
import { useAppState, isPaid } from "@/lib/state";
import { useSeenNews } from "@/features/news/hooks/useSeenNews";
import {
  SectionNumber,
  DataLabel,
  ImpactPill,
  BiasBadge,
} from "@/components/ui/Marker";
import { formatTime, formatDate } from "@/lib/cn";
import type { NewsListItem } from "@/features/news/queries/news";

interface Props {
  news: NewsListItem[];
}

export function BriefClient({ news }: Props) {
  const { tier } = useAppState();
  const paid = isPaid(tier);
  const { ids: seenIds, hydrated: seenHydrated } = useSeenNews();
  const [hideSeen, setHideSeen] = useState(false);
  const plan = tradingPlans[0];
  const topNewsFull = news.slice(0, 4);
  const topNews =
    hideSeen && seenHydrated
      ? topNewsFull.filter((n) => !seenIds.includes(n.id))
      : topNewsFull;
  const seenInTop = seenHydrated
    ? topNewsFull.filter((n) => seenIds.includes(n.id)).length
    : 0;

  const latestTs = news[0]
    ? (news[0].published_at ?? news[0].fetched_at)
    : null;

  return (
    <div className="stagger bg-grid">
      <div className="border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-baseline justify-between">
            <div>
              <DataLabel>
                Brief{latestTs ? ` · ${formatDate(latestTs)}` : ""}
              </DataLabel>
              <h1 className="mt-2 font-display text-5xl leading-none text-white lg:text-6xl">
                Today's <span className="italic text-brand">DOMAIN</span>
              </h1>
            </div>
            <div className="hidden text-right font-mono text-[10px] uppercase tracking-widest2 text-white/40 sm:block">
              <div>News · {news.length}</div>
              <div>Open setups · {plan.setups.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 p-6">
        <section className="col-span-12 lg:col-span-8">
          <div className="flex items-center justify-between">
            <SectionNumber n="01 /" label="LIVE NEWS" />
            {seenInTop > 0 && (
              <button
                onClick={() => setHideSeen((v) => !v)}
                className={
                  "border px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 transition-colors " +
                  (hideSeen
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-gray-3 text-white/60 hover:border-brand hover:text-brand")
                }
              >
                {hideSeen
                  ? `✓ HIDING ${seenInTop} SEEN`
                  : `HIDE ${seenInTop} SEEN`}
              </button>
            )}
          </div>
          {topNews.length === 0 ? (
            <div className="mt-4 border border-gray-3 bg-black p-8 text-center">
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                No news items yet
              </div>
              <div className="mt-2 font-display text-sm text-white/30">
                Items will appear here once approved by the desk.
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-px bg-gray-3">
              {topNews.map((n) => {
                const seen = seenHydrated && seenIds.includes(n.id);
                const ts = n.published_at ?? n.fetched_at;
                return (
                  <Link
                    key={n.id}
                    href={`/app/news/${n.id}`}
                    className={
                      "group block bg-black p-5 transition-colors hover:bg-gray-2 " +
                      (seen ? "opacity-60 hover:opacity-100" : "")
                    }
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                        [{n.source_code}]
                      </span>
                      <ImpactPill level={n.impact} />
                      <BiasBadge bias={n.bias} />
                      {seen && (
                        <span className="font-mono text-[8px] uppercase tracking-widest2 text-white/40">
                          ✓ SEEN
                        </span>
                      )}
                      <span className="ml-auto font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                        {formatTime(ts)}Z · BY {n.author.toUpperCase()}
                      </span>
                    </div>
                    <h3
                      className={
                        "mt-3 font-display text-2xl leading-snug transition-colors group-hover:text-brand " +
                        (seen ? "text-white/70" : "text-white")
                      }
                    >
                      {n.headline}
                    </h3>
                    <p className="mt-2 text-sm text-white/70">{n.analysis}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {n.affects.map((a) => (
                        <span
                          key={a}
                          className="border border-white/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/60"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          <Link
            href="/app/news"
            className="mt-4 inline-flex font-mono text-[10px] uppercase tracking-widest2 text-brand hover:underline"
          >
            FULL FEED →
          </Link>
        </section>

        <aside className="col-span-12 space-y-8 lg:col-span-4">
          <div className="border border-brand/40 bg-gray-2/30 p-5 scanline">
            <div className="flex items-center justify-between">
              <DataLabel>Trading Plan · TX-03</DataLabel>
              {paid ? (
                <span className="font-mono text-[9px] uppercase tracking-widest2 text-moss">
                  ○ UNLOCKED
                </span>
              ) : (
                <span className="font-mono text-[9px] uppercase tracking-widest2 text-blood-bright">
                  ● LOCKED
                </span>
              )}
            </div>
            <h3 className="mt-3 font-display text-2xl text-white">
              {paid
                ? plan.thesis.slice(0, 100) + "…"
                : "Bias is repricing the cut path. Three setups live."}
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              {plan.setups.map((s) => (
                <div
                  key={s.id}
                  className="border border-gray-3 bg-black p-2"
                >
                  <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                    {s.instrument}
                  </div>
                  <div
                    className={
                      "font-display text-sm " +
                      (s.direction === "long" ? "text-moss" : "text-brand")
                    }
                  >
                    {s.direction === "long" ? "LONG" : "SHORT"}
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/app/plan"
              className="mt-4 block border border-brand/60 py-2 text-center font-mono text-[10px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black"
            >
              {paid ? "Open plan →" : "Unlock plan →"}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
