"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { primers } from "@/features/education/mock";
import { channelPosts } from "@/features/channel/mock";
import { getPlanById } from "@/features/plan/mock";
import { useSeenNews } from "@/features/news/hooks/useSeenNews";
import {
  DataLabel,
  SectionNumber,
  ImpactPill,
  BiasBadge,
} from "@/components/ui/Marker";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { WatchPin } from "@/features/watchlist/components/WatchPin";
import { formatDate, formatTime } from "@/lib/cn";
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
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      if (e.key === "j") {
        e.preventDefault();
        const target = next ?? relatedFeed[0];
        if (target) router.push(`/app/news/${target.id}`);
      } else if (e.key === "k") {
        e.preventDefault();
        const target = prev ?? relatedFeed[relatedFeed.length - 1];
        if (target) router.push(`/app/news/${target.id}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, router, relatedFeed]);

  const relatedNews = relatedFeed
    .filter((n) => n.id !== item.id)
    .map((n) => ({
      n,
      shared: n.tags.filter((t) => item.tags.includes(t)).length,
    }))
    .filter((x) => x.shared > 0)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, 4)
    .map((x) => x.n);

  const relatedPrimers = primers
    .filter((p) => p.tags.some((t) => item.tags.includes(t as (typeof p.tags)[number])))
    .slice(0, 2);

  const relatedChannel = channelPosts
    .filter((c) => c.tags.some((t) => item.tags.includes(t as (typeof c.tags)[number])))
    .slice(0, 2);

  const hasRelated =
    relatedNews.length + relatedPrimers.length + relatedChannel.length > 0;

  const ts = item.published_at ?? item.fetched_at;

  return (
    <div className="bg-grid-fine">
      <div className="border-b border-ink-3 bg-ink-2/30">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/app" },
              { label: "News", href: "/app/news" },
              { label: `[${item.source_code}]` },
            ]}
          />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
              [{item.source_code}]
            </span>
            <ImpactPill level={item.impact} />
            <BiasBadge bias={item.bias} />
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
              {formatDate(ts)} · {formatTime(ts)}Z
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
              BY {item.author.toUpperCase()}
            </span>
          </div>

          <h1 className="mt-4 font-display text-5xl leading-[1.05] text-paper">
            {item.headline}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <SectionNumber n="01 /" label="WHAT THIS MEANS FOR PRICE" />
        <div className="mt-4 border-l-4 border-lime bg-ink-2/40 p-6">
          <p className="font-display text-xl leading-relaxed text-paper/90">
            {item.analysis}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-7">
            <SectionNumber n="02 /" label="AFFECTS" />
            <div className="mt-4 flex flex-wrap gap-2">
              {item.affects.map((a) => (
                <div
                  key={a}
                  className="flex items-center gap-1.5 border border-lime/40 px-3 py-1.5 font-mono text-xs uppercase tracking-widest2 text-lime"
                >
                  <span>{a}</span>
                  <WatchPin ticker={a} />
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 md:col-span-5">
            <SectionNumber n="03 /" label="METADATA" />
            <dl className="mt-4 space-y-2 border border-ink-3 bg-ink-2/30 p-4 font-mono text-xs">
              <Row label="Source" value={`[${item.source_code}]`} />
              <Row label="Author" value={item.author} />
              <Row label="Captured" value={`${formatTime(ts)}Z`} />
              <Row label="Impact" value={item.impact.toUpperCase()} />
              <Row label="Bias" value={item.bias.toUpperCase()} />
            </dl>
          </div>
        </div>

        {item.tags.length > 0 && (
          <div className="mt-12">
            <SectionNumber n="04 /" label="TAGGED" />
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tags.map((t) => (
                <Link
                  key={t}
                  href={`/app/tags/${t}`}
                  className="border border-lime/40 px-3 py-1 font-mono text-[10px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
                >
                  #{t}
                </Link>
              ))}
            </div>
          </div>
        )}

        {hasRelated && (
          <div className="mt-12 border-t border-ink-3 pt-10">
            <SectionNumber n="05 /" label="RELATED · BY HASHTAG" />
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
              Other items in the DOMAIN that share at least one tag with this article.
            </p>

            {relatedNews.length > 0 && (
              <div className="mt-6">
                <DataLabel>News · {relatedNews.length}</DataLabel>
                <div className="mt-3 grid grid-cols-1 gap-px bg-ink-3 md:grid-cols-2">
                  {relatedNews.map((n) => (
                    <Link
                      key={n.id}
                      href={`/app/news/${n.id}`}
                      className="group bg-ink p-4 transition-colors hover:bg-ink-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] uppercase tracking-widest2 text-lime">
                          [{n.source_code}]
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                          · BY {n.author.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-1 font-display text-lg leading-snug text-paper transition-colors group-hover:text-lime">
                        {n.headline}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {n.tags.map((t) => (
                          <span
                            key={t}
                            className={
                              "font-mono text-[9px] uppercase tracking-widest2 " +
                              (item.tags.includes(t)
                                ? "text-lime"
                                : "text-paper/30")
                            }
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {relatedPrimers.length > 0 && (
              <div className="mt-6">
                <DataLabel>Primers · {relatedPrimers.length}</DataLabel>
                <div className="mt-3 grid grid-cols-1 gap-px bg-ink-3 md:grid-cols-2">
                  {relatedPrimers.map((p) => (
                    <Link
                      key={p.id}
                      href={`/app/education/${p.id}`}
                      className="group bg-ink p-4 transition-colors hover:bg-ink-2"
                    >
                      <div className="font-mono text-[9px] uppercase tracking-widest2 text-lime">
                        {p.id} · {p.readingMin} min
                      </div>
                      <div className="mt-1 font-display text-lg leading-snug text-paper transition-colors group-hover:text-lime">
                        {p.title}
                      </div>
                      <div className="mt-1 font-mono text-[9px] italic uppercase tracking-widest2 text-lime/60">
                        {p.framework}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {relatedChannel.length > 0 && (
              <div className="mt-6">
                <DataLabel>Channel posts · {relatedChannel.length}</DataLabel>
                <div className="mt-3 space-y-px bg-ink-3">
                  {relatedChannel.map((c) => (
                    <Link
                      key={c.id}
                      href="/app/channel"
                      className="group block bg-ink p-4 transition-colors hover:bg-ink-2"
                    >
                      <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest2">
                        <span className="text-lime">{c.id}</span>
                        <span className="text-paper/40">
                          · BY {c.author.toUpperCase()} · {formatDate(c.ts)}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-paper/80 group-hover:text-paper">
                        {c.body}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <nav className="mt-16 grid grid-cols-2 gap-px border border-ink-3 bg-ink-3">
          <Link
            href={prev ? `/app/news/${prev.id}` : "/app/news"}
            className={
              "block bg-ink p-4 transition-colors hover:bg-ink-2 " +
              (prev ? "" : "pointer-events-none opacity-30")
            }
          >
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
              ← Newer
            </div>
            <div className="mt-1 line-clamp-1 text-sm text-paper">
              {prev?.headline ?? "Top of feed"}
            </div>
          </Link>
          <Link
            href={next ? `/app/news/${next.id}` : "/app/news"}
            className={
              "block bg-ink p-4 text-right transition-colors hover:bg-ink-2 " +
              (next ? "" : "pointer-events-none opacity-30")
            }
          >
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
              Older →
            </div>
            <div className="mt-1 line-clamp-1 text-sm text-paper">
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
      <dt className="text-[10px] uppercase tracking-widest2 text-paper/40">
        {label}
      </dt>
      <dd className="text-paper">{value}</dd>
    </div>
  );
}
