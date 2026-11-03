"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppState, isPaid } from "@/lib/state";
import { useSeenNews } from "@/features/news/hooks/useSeenNews";
import { Panel, PanelLink } from "@/components/ui/Panel";
import { cn, formatWibTime, formatDate } from "@/lib/cn";
import type { NewsListItem } from "@/features/news/queries/news";
import type { TradingPlan } from "@/features/plan/types";

interface Props {
  news: NewsListItem[];
  plan: TradingPlan | null;
}

const eyebrow = "text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";

function Meta({ n, seen }: { n: NewsListItem; seen: boolean }) {
  const ts = n.publishedAt ?? n.fetchedAt;
  return (
    <p className={eyebrow}>
      {n.sourceCode}
      <span className="px-1.5 text-white/20">/</span>
      {formatWibTime(ts)} WIB
      <span className="hidden sm:inline">
        <span className="px-1.5 text-white/20">/</span>
        {n.author}
      </span>
      {n.impact === "high" && <span className="ml-2 text-brand">High impact</span>}
      {n.bias !== "neutral" && (
        <span className={cn("ml-2", n.bias === "bullish" ? "text-up" : "text-down")}>{n.bias === "bullish" ? "▲ Bull" : "▼ Bear"}</span>
      )}
      {seen && <span className="ml-2 font-medium normal-case tracking-normal text-white/30">· seen</span>}
    </p>
  );
}

function Chips({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {items.map((a) => (
        <span key={a} className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] font-medium text-white/60">
          {a}
        </span>
      ))}
    </div>
  );
}

export function BriefClient({ news, plan }: Props) {
  const { tier } = useAppState();
  const paid = isPaid(tier);
  const { ids: seenIds, hydrated: seenHydrated } = useSeenNews();
  const [hideSeen, setHideSeen] = useState(false);
  const topNewsFull = news.slice(0, 4);
  const topNews = hideSeen && seenHydrated ? topNewsFull.filter((n) => !seenIds.includes(n.id)) : topNewsFull;
  const seenInTop = seenHydrated ? topNewsFull.filter((n) => seenIds.includes(n.id)).length : 0;
  const isSeen = (id: string) => seenHydrated && seenIds.includes(id);

  const latestTs = news[0] ? (news[0].publishedAt ?? news[0].fetchedAt) : null;

  // Everything published on the same WIB day as the newest item.
  const tape = useMemo(() => {
    if (!latestTs) return null;
    const day = formatDate(latestTs);
    const items = news.filter((n) => formatDate(n.publishedAt ?? n.fetchedAt) === day);
    const bias = { bullish: 0, neutral: 0, bearish: 0 };
    const mentions = new Map<string, number>();
    for (const n of items) {
      bias[n.bias]++;
      for (const a of n.affects) mentions.set(a, (mentions.get(a) ?? 0) + 1);
    }
    return {
      day,
      total: items.length,
      high: items.filter((n) => n.impact === "high").length,
      bias,
      mentions: [...mentions].sort((a, b) => b[1] - a[1]).slice(0, 6),
    };
  }, [news, latestTs]);

  const [lead, ...rest] = topNews;

  return (
    <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        <Panel
          title={latestTs ? `Brief for ${formatDate(latestTs)}` : "Brief"}
          sub="The four stories the desk is leading with"
          action={
            seenInTop > 0 ? (
              <button
                type="button"
                onClick={() => setHideSeen((v) => !v)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[13px] font-medium transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
                  hideSeen ? "text-brand" : "text-white/55 hover:text-white",
                )}
              >
                {hideSeen ? `Hiding ${seenInTop} seen` : `Hide ${seenInTop} seen`}
              </button>
            ) : null
          }
        >
          {!lead ? (
            <p className="py-10 text-center text-[14px] text-white/40">
              {topNewsFull.length === 0 ? "No news yet. Items appear here once the desk approves them." : "You have read everything in the brief."}
            </p>
          ) : (
            <div className="max-w-[72ch]">
              <Link
                href={`/app/news/${lead.id}`}
                className="group block pb-6 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
              >
                <Meta n={lead} seen={isSeen(lead.id)} />
                <h2
                  className={cn(
                    "mt-2 text-balance font-num text-[30px] font-semibold leading-[34px] transition-colors group-hover:text-brand sm:text-[38px] sm:leading-[42px]",
                    isSeen(lead.id) ? "text-white/60" : "text-white",
                  )}
                >
                  {lead.headline}
                </h2>
                <p className="mt-3 line-clamp-5 text-[16px] leading-[26px] text-white/75">{lead.analysis}</p>
                <Chips items={lead.affects} />
              </Link>
              {rest.length > 0 && (
                <ul className="divide-y divide-white/[0.07] border-t border-white/[0.07]">
                  {rest.map((n) => (
                    <li key={n.id}>
                      <Link
                        href={`/app/news/${n.id}`}
                        className="group block py-5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                      >
                        <Meta n={n} seen={isSeen(n.id)} />
                        <h3
                          className={cn(
                            "mt-1.5 text-[19px] font-medium leading-[26px] transition-colors group-hover:text-brand",
                            isSeen(n.id) ? "text-white/55" : "text-white",
                          )}
                        >
                          {n.headline}
                        </h3>
                        <p className="mt-1.5 line-clamp-3 text-[15px] leading-[23px] text-white/60">{n.analysis}</p>
                        <Chips items={n.affects} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <Link
            href="/app/news"
            className="mt-4 inline-flex rounded-full border border-white/[0.14] px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            Full news feed →
          </Link>
        </Panel>
      </div>

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel
          title="Trading plan"
          sub={plan ? `${plan.horizon} · ${formatDate(plan.date)}` : undefined}
          action={plan ? <span className={cn("text-[12px] font-semibold", paid ? "text-up" : "text-white/40")}>{paid ? "Unlocked" : "Locked"}</span> : null}
        >
          {plan ? (
            <>
              <p className="text-[15px] leading-[22px] text-white/85">
                {paid ? (plan.thesis.length > 160 ? plan.thesis.slice(0, 160) + "…" : plan.thesis) : "The latest plan is published. Upgrade to read the thesis and levels."}
              </p>
              {plan.setups.length > 0 && (
                <ul className="mt-3 divide-y divide-white/[0.07]">
                  {plan.setups.map((s) => (
                    <li key={s.id} className="flex items-center justify-between py-2">
                      <span className="text-[14px] font-semibold text-white">{s.instrument}</span>
                      <span className={cn("text-[12px] font-semibold uppercase tracking-[0.06em]", s.direction === "long" ? "text-up" : "text-down")}>
                        {s.direction === "long" ? "▲ Long" : "▼ Short"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-[14px] text-white/40">No published plan yet. It shows here once the desk publishes one.</p>
          )}
          <Link
            href="/app/plan"
            className={cn(
              "mt-4 block rounded-full py-2 text-center text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
              paid ? "border border-white/[0.14] text-white hover:bg-raised" : "bg-brand text-black hover:bg-brand/90",
            )}
          >
            {paid ? "Open plan" : "Unlock plan"}
          </Link>
        </Panel>

        {tape && (
          <Panel title="The day's tape" sub={`Everything approved on ${tape.day}`} action={<PanelLink href="/app/news">News</PanelLink>}>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
                <div className="font-num text-[32px] font-semibold leading-8 text-white">{tape.total}</div>
                <div className="mt-0.5 text-[12px] text-white/40">Stories</div>
              </div>
              <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
                <div className="font-num text-[32px] font-semibold leading-8 text-brand">{tape.high}</div>
                <div className="mt-0.5 text-[12px] text-white/40">High impact</div>
              </div>
            </div>

            {tape.total > 0 && (
              <>
                <div className={cn(eyebrow, "mt-5")}>Bias split</div>
                <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <span className="bg-up" style={{ width: `${(tape.bias.bullish / tape.total) * 100}%` }} />
                  <span className="bg-white/25" style={{ width: `${(tape.bias.neutral / tape.total) * 100}%` }} />
                  <span className="bg-down" style={{ width: `${(tape.bias.bearish / tape.total) * 100}%` }} />
                </div>
                <div className="mt-1.5 flex justify-between text-[12px]">
                  <span className="text-up">{tape.bias.bullish} bull</span>
                  <span className="text-white/40">{tape.bias.neutral} neutral</span>
                  <span className="text-down">{tape.bias.bearish} bear</span>
                </div>
              </>
            )}

            {tape.mentions.length > 0 && (
              <>
                <div className={cn(eyebrow, "mt-5")}>Most mentioned</div>
                <ul className="mt-1 divide-y divide-white/[0.07]">
                  {tape.mentions.map(([sym, c]) => (
                    <li key={sym} className="flex items-center justify-between py-2">
                      <span className="text-[14px] font-semibold text-white">{sym}</span>
                      <span className="font-num text-[17px] font-semibold text-white/75">{c}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>
        )}
      </aside>
    </div>
  );
}
