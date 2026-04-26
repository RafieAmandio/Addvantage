"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSeenNews } from "@/features/news/hooks/useSeenNews";
import {
  DataLabel,
  SectionNumber,
  ImpactPill,
  BiasBadge,
} from "@/components/ui/Marker";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { WatchPin } from "@/features/watchlist/components/WatchPin";
import { RelatedPlansChips } from "@/features/news/components/RelatedPlansChips";
import { formatDate, formatTime, cn } from "@/lib/cn";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

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

  const ts = item.published_at ?? item.fetched_at;

  return (
    <div className="bg-grid-fine stagger">
      <div className="border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/app" },
              { label: "News", href: "/app/news" },
              { label: `[${item.source_code}]` },
            ]}
          />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
              [{item.source_code}]
            </span>
            <ImpactPill level={item.impact} />
            <BiasBadge bias={item.bias} />
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
              {formatDate(ts)} · {formatTime(ts)}Z
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
              BY {item.author.toUpperCase()}
            </span>
          </div>

          <h1 className="mt-4 font-display text-3xl leading-[1.05] text-white sm:text-4xl md:text-5xl">
            {item.headline}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <SectionNumber n="01 /" label="WHAT THIS MEANS FOR PRICE" />
        <div className="mt-4 border-l-4 border-brand bg-gray-2/40 p-4 sm:p-6">
          <p className="font-display text-base leading-relaxed text-white/90 sm:text-xl">
            {item.analysis}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-12 gap-4 sm:mt-12 sm:gap-6">
          <div className="col-span-12 md:col-span-7">
            <SectionNumber n="02 /" label="AFFECTS" />
            <div className="mt-4 flex flex-wrap gap-2">
              {item.affects.map((a) => (
                <div
                  key={a}
                  className="flex items-center gap-1.5 border border-brand/40 px-3 py-1.5 font-mono text-xs uppercase tracking-widest2 text-brand"
                >
                  <span>{a}</span>
                  <WatchPin ticker={a} />
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 md:col-span-5">
            <SectionNumber n="03 /" label="METADATA" />
            <dl className="mt-4 space-y-2 border border-gray-3 bg-gray-2/30 p-4 font-mono text-xs">
              <Row label="Source" value={`[${item.source_code}]`} />
              <Row label="Author" value={item.author} />
              <Row label="Captured" value={`${formatTime(ts)}Z`} />
              <Row label="Impact" value={item.impact.toUpperCase()} />
              <Row label="Bias" value={item.bias.toUpperCase()} />
            </dl>
          </div>
        </div>

        {(item.related_plan_ids ?? []).length > 0 && (
          <>
            <div className="mt-8 sm:mt-12">
              <SectionNumber n="04 /" label="LINKED PLANS" />
            </div>
            <RelatedPlansChips
              planIds={item.related_plan_ids}
              className="mt-4"
            />
          </>
        )}

        {item.tags.length > 0 && (
          <div className="mt-8 sm:mt-12">
            <SectionNumber n="05 /" label="TAGGED" />
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tags.map((t) => (
                <Link
                  key={t}
                  href={`/app/tags/${t}`}
                  className="border border-brand/40 px-3 py-1 font-mono text-[10px] uppercase tracking-widest2 text-brand transition-colors hover:bg-brand hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                >
                  #{t}
                </Link>
              ))}
            </div>
          </div>
        )}

        {relatedNews.length > 0 && (
          <div className="mt-8 border-t border-gray-3 pt-8 sm:mt-12 sm:pt-10">
            <SectionNumber n="06 /" label="RELATED · BY HASHTAG" />
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
              Other items in the DOMAIN that share at least one tag with this article.
            </p>

            <div className="mt-6">
              <DataLabel>News · {relatedNews.length}</DataLabel>
              <div className="mt-3 grid grid-cols-1 gap-px bg-gray-3 md:grid-cols-2">
                {relatedNews.map((n) => (
                  <Link
                    key={n.id}
                    href={`/app/news/${n.id}`}
                    className="group bg-black p-4 transition-all hover:-translate-y-px hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-widest2 text-brand">
                        [{n.source_code}]
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                        · BY {n.author.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-1 font-display text-lg leading-snug text-white transition-colors group-hover:text-brand">
                      {n.headline}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {n.tags.map((t) => (
                        <span
                          key={t}
                          className={cn(
                            "font-mono text-[9px] uppercase tracking-widest2",
                            item.tags.includes(t)
                              ? "text-brand"
                              : "text-white/30"
                          )}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        <nav className="mt-10 grid grid-cols-2 gap-px border border-gray-3 bg-gray-3 sm:mt-16">
          <Link
            href={prev ? `/app/news/${prev.id}` : "/app/news"}
            className={cn(
              "block bg-black p-4 transition-all hover:-translate-y-px hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
              !prev && "pointer-events-none opacity-30"
            )}
          >
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
              ← Newer
            </div>
            <div className="mt-1 line-clamp-1 text-sm text-white">
              {prev?.headline ?? "Top of feed"}
            </div>
          </Link>
          <Link
            href={next ? `/app/news/${next.id}` : "/app/news"}
            className={cn(
              "block bg-black p-4 text-right transition-all hover:-translate-y-px hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
              !next && "pointer-events-none opacity-30"
            )}
          >
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
              Older →
            </div>
            <div className="mt-1 line-clamp-1 text-sm text-white">
              {next?.headline ?? "Bottom of feed"}
            </div>
          </Link>
        </nav>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[10px] uppercase tracking-widest2 text-white/40">
        {label}
      </dt>
      <dd className="text-white">{value}</dd>
    </div>
  );
}
