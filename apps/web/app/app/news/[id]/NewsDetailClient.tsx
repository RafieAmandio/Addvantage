"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSeenNews } from "@/features/news/hooks/useSeenNews";
import { FOREX_PAIRS } from "@tradevantage/shared";
import { Panel, PanelLink } from "@/components/ui/Panel";
import { WatchPin } from "@/features/watchlist/components/WatchPin";
import { RelatedPlansChips } from "@/features/news/components/RelatedPlansChips";
import { formatDate, formatWibTime, cn } from "@/lib/cn";

const PAIRS = new Set(FOREX_PAIRS.map((p) => p.symbol.replace("/", "")));
import type { NewsListItem } from "@/features/news/queries/news";

interface Props {
  item: NewsListItem;
  relatedFeed: NewsListItem[];
}

export function NewsDetailClient({ item, relatedFeed }: Props) {
  const router = useRouter();
  const { markSeen } = useSeenNews();

  useEffect(() => {
    markSeen(item.id);
  }, [item.id, markSeen]);

  const idx = relatedFeed.findIndex((n) => n.id === item.id);
  const prev = idx > 0 ? relatedFeed[idx - 1] : null;
  const next =
    idx >= 0 && idx < relatedFeed.length - 1 ? relatedFeed[idx + 1] : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el) {
        const tag = el.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          el.isContentEditable
        ) {
          return;
        }
      }
      if (e.key === "j") {
        e.preventDefault();
        const dest = next ?? relatedFeed[0];
        if (dest) router.push(`/app/news/${dest.id}`);
      } else if (e.key === "k") {
        e.preventDefault();
        const dest = prev ?? relatedFeed[relatedFeed.length - 1];
        if (dest) router.push(`/app/news/${dest.id}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, router, relatedFeed]);

  const relatedNews = useMemo(
    () =>
      relatedFeed
        .filter((n) => n.id !== item.id)
        .map((n) => ({
          n,
          shared: n.tags.filter((t) => item.tags.includes(t)).length,
        }))
        .filter((x) => x.shared > 0)
        .sort((a, b) => b.shared - a.shared)
        .slice(0, 4)
        .map((x) => x.n),
    [relatedFeed, item.id, item.tags]
  );

  const ts = item.publishedAt ?? item.fetchedAt;

  return (
    <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <article className="min-w-0 space-y-4">
        <section className="rounded-2xl bg-panel p-5 sm:p-8">
          <Link href="/app/news" className="text-[13px] text-white/40 hover:text-white">
            ← News
          </Link>
          <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
            {item.sourceCode}
            <span className="px-1.5 text-white/20">/</span>
            {formatDate(ts)} · {formatWibTime(ts)} WIB
            <span className="px-1.5 text-white/20">/</span>
            {item.author}
            {item.impact === "high" && <span className="ml-2 text-brand">High impact</span>}
          </p>
          <h1 className="mt-2 text-balance font-num text-[34px] font-semibold leading-[38px] text-white sm:text-[44px] sm:leading-[46px]">
            {item.headline}
          </h1>
          {item.bias !== "neutral" && (
            <p className={cn("mt-3 text-[13px] font-semibold uppercase tracking-[0.06em]", item.bias === "bullish" ? "text-up" : "text-down")}>
              {item.bias === "bullish" ? "▲ Bullish read" : "▼ Bearish read"}
            </p>
          )}

          <h2 className="mt-8 text-[12px] font-semibold uppercase tracking-[0.08em] text-brand">What this means for price</h2>
          <div className="mt-3 max-w-[68ch] space-y-4">
            {item.analysis.split("\n\n").map((para, i) => (
              <p key={i} className="text-[17px] leading-[28px] text-white/85">
                {para}
              </p>
            ))}
          </div>
        </section>

        {relatedNews.length > 0 && (
          <Panel title="Related" sub="Shares at least one tag with this item">
            <ul className="-my-1 divide-y divide-white/[0.07]">
              {relatedNews.map((n) => (
                <li key={n.id}>
                  <Link href={`/app/news/${n.id}`} className="group block py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
                      {n.sourceCode}
                      <span className="px-1.5 text-white/20">/</span>
                      {n.tags.filter((t) => item.tags.includes(t)).map((t) => `#${t}`).join(" ")}
                    </p>
                    <p className="mt-0.5 text-[15px] leading-[22px] text-white/85 group-hover:text-white">{n.headline}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <nav className="grid grid-cols-2 gap-4" aria-label="Newer and older items">
          {[
            { to: prev, label: "← Newer", fallback: "Top of feed", right: false },
            { to: next, label: "Older →", fallback: "Bottom of feed", right: true },
          ].map((x) => (
            <Link
              key={x.label}
              href={x.to ? `/app/news/${x.to.id}` : "/app/news"}
              className={cn(
                "block rounded-2xl bg-panel p-4 transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
                x.right && "text-right",
                !x.to && "pointer-events-none opacity-30",
              )}
            >
              <span className="text-[12px] text-white/40">
                {x.label} <kbd className="hidden font-mono sm:inline">{x.right ? "j" : "k"}</kbd>
              </span>
              <span className="mt-1 line-clamp-1 block text-[14px] text-white">{x.to?.headline ?? x.fallback}</span>
            </Link>
          ))}
        </nav>
      </article>

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel title="Affects" sub="Pin to your watchlist with the star">
          <ul className="-my-1 divide-y divide-white/[0.07]">
            {item.affects.map((a) => (
              <li key={a} className="flex items-center justify-between gap-3 py-2">
                {PAIRS.has(a) ? (
                  <Link href={`/app/instrument/${a}`} className="text-[14px] font-semibold text-white hover:text-brand">
                    {a} <span className="font-normal text-white/30">→</span>
                  </Link>
                ) : (
                  <span className="text-[14px] font-semibold text-white/75">{a}</span>
                )}
                <WatchPin ticker={a} />
              </li>
            ))}
          </ul>
        </Panel>

        {(item.relatedPlanIds ?? []).length > 0 && (
          <Panel title="Linked plans">
            <RelatedPlansChips planIds={item.relatedPlanIds} />
          </Panel>
        )}

        {item.tags.length > 0 && (
          <Panel title="Tags" action={<PanelLink href="/app/tags">All</PanelLink>}>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((t) => (
                <Link
                  key={t}
                  href={`/app/tags/${t}`}
                  className="rounded-full border border-white/[0.12] px-2.5 py-0.5 text-[12px] text-white/70 transition-colors hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                >
                  #{t}
                </Link>
              ))}
            </div>
          </Panel>
        )}
      </aside>
    </div>
  );
}

