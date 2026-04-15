"use client";

import Link from "next/link";
import { useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import { news } from "@/lib/mock/news";
import { primers } from "@/lib/mock/primers";
import { channelPosts } from "@/lib/mock/channel";
import { getPlanById } from "@/lib/mock/plans";
import { useSeenNews } from "@/lib/seenNews";
import {
  DataLabel,
  SectionNumber,
  ImpactPill,
  BiasBadge,
} from "@/components/ui/Marker";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { WatchPin } from "@/components/ui/WatchPin";
import { formatDate, formatTime } from "@/lib/cn";

export default function NewsDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const { markSeen } = useSeenNews();
  const item = news.find((n) => n.id === id);

  // Mark this article as seen on mount. Side effect is a no-op on repeat.
  useEffect(() => {
    if (item) markSeen(item.id);
    // markSeen is stable; item.id is all that matters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const idx = news.findIndex((n) => n.id === id);
  const prev = idx > 0 ? news[idx - 1] : null;
  const next = idx < news.length - 1 ? news[idx + 1] : null;

  // j / k keyboard navigation — vim-style prev/next article.
  // Wraps around at the ends so ] after the last article goes to the first.
  // Registered before the not-found check so Hooks are unconditional.
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
        const target = next ?? news[0]; // wrap to first
        router.push(`/app/news/${target.id}`);
      } else if (e.key === "k") {
        e.preventDefault();
        const target = prev ?? news[news.length - 1]; // wrap to last
        router.push(`/app/news/${target.id}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, router]);

  if (!item) return notFound();

  // Related items — anything that shares at least one tag with this article.
  // Excludes the article itself. Ordered by shared-tag count descending.
  const relatedNews = news
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
    .filter((p) => p.tags.some((t) => item.tags.includes(t)))
    .slice(0, 2);

  const relatedChannel = channelPosts
    .filter((c) => c.tags.some((t) => item.tags.includes(t)))
    .slice(0, 2);

  const hasRelated =
    relatedNews.length + relatedPrimers.length + relatedChannel.length > 0;

  // Direct backlinks to plans this news item informs (may be multiple)
  const relatedPlans =
    item.relatedPlanIds
      ?.map((id) => getPlanById(id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined) ?? [];

  return (
    <div className="bg-grid-fine">
      <div className="border-b border-ink-3 bg-ink-2/30">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/app" },
              { label: "News", href: "/app/news" },
              { label: item.id },
            ]}
          />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-amber">
              {item.id}
            </span>
            <ImpactPill level={item.impact} />
            <BiasBadge bias={item.bias} />
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
              {formatDate(item.ts)} · {formatTime(item.ts)}Z
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-amber">
              BY {item.author.toUpperCase()}
            </span>
            {relatedPlans.map((p) => (
              <Link
                key={p.id}
                href={`/app/plan/${p.id}`}
                title={`Informs trading plan ${p.id}`}
                className="inline-flex items-center gap-1.5 border border-amber/60 bg-amber/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest2 text-amber hover:bg-amber hover:text-ink"
              >
                ↗ INFORMS · {p.id}
              </Link>
            ))}
          </div>

          <h1 className="mt-4 font-display text-5xl leading-[1.05] text-paper">
            {item.headline}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <SectionNumber n="01 /" label="WHAT THIS MEANS FOR PRICE" />
        <div className="mt-4 border-l-4 border-amber bg-ink-2/40 p-6">
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
                  className="flex items-center gap-1.5 border border-amber/40 px-3 py-1.5 font-mono text-xs uppercase tracking-widest2 text-amber"
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
              <Row label="Item ID" value={item.id} />
              <Row label="Author" value={item.author} />
              <Row label="Captured" value={`${formatTime(item.ts)}Z`} />
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
                  className="border border-amber/40 px-3 py-1 font-mono text-[10px] uppercase tracking-widest2 text-amber hover:bg-amber hover:text-ink"
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
                        <span className="font-mono text-[9px] uppercase tracking-widest2 text-amber">
                          {n.id}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                          · BY {n.author.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-1 font-display text-lg leading-snug text-paper transition-colors group-hover:text-amber">
                        {n.headline}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {n.tags.map((t) => (
                          <span
                            key={t}
                            className={
                              "font-mono text-[9px] uppercase tracking-widest2 " +
                              (item.tags.includes(t)
                                ? "text-amber"
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
                      <div className="font-mono text-[9px] uppercase tracking-widest2 text-amber">
                        {p.id} · {p.readingMin} min
                      </div>
                      <div className="mt-1 font-display text-lg leading-snug text-paper transition-colors group-hover:text-amber">
                        {p.title}
                      </div>
                      <div className="mt-1 font-mono text-[9px] italic uppercase tracking-widest2 text-amber/60">
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
                        <span className="text-amber">{c.id}</span>
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
