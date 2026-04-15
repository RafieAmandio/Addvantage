"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { allHashtags, hashtagMeta } from "@/lib/mock/hashtags";
import { primers } from "@/lib/mock/primers";
import { news } from "@/lib/mock/news";
import { consultSessions } from "@/lib/mock/consultations";
import { channelPosts } from "@/lib/mock/channel";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import { formatDate } from "@/lib/cn";
import type { Hashtag } from "@/lib/mock/types";

export default function TagPage({
  params,
}: {
  params: { tag: string };
}) {
  const { tag: rawTag } = params;
  if (!allHashtags.includes(rawTag as Hashtag)) return notFound();
  const tag = rawTag as Hashtag;
  const meta = hashtagMeta[tag];

  const matchedPrimers = primers.filter((p) => p.tags.includes(tag));
  const matchedNews = news.filter((n) => n.tags.includes(tag));
  const matchedSessions = consultSessions.filter((s) =>
    s.tags.includes(tag)
  );
  const matchedChannel = channelPosts.filter((c) => c.tags.includes(tag));
  const total =
    matchedPrimers.length +
    matchedNews.length +
    matchedSessions.length +
    matchedChannel.length;

  return (
    <div className="bg-grid-fine">
      <div className="border-b border-ink-3 bg-ink-2/30">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Link
            href="/app/tags"
            className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40 hover:text-amber"
          >
            ← All hashtags
          </Link>
          <DataLabel className="mt-6">Hashtag · cross-cut</DataLabel>
          <h1 className="mt-2 font-display text-6xl leading-none text-paper">
            <span className="text-amber">#</span>
            {tag}
          </h1>
          <div className="mt-2 font-mono text-xs italic uppercase tracking-widest2 text-amber/80">
            {meta.label}
          </div>
          <p className="mt-3 max-w-2xl text-paper/70">{meta.description}</p>
          <div className="mt-4 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
            {total} TOTAL ITEMS · {matchedPrimers.length} PRIMERS ·{" "}
            {matchedNews.length} NEWS · {matchedSessions.length} CONSULT ·{" "}
            {matchedChannel.length} CHANNEL
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {matchedPrimers.length > 0 && (
          <Group n="01 /" label="PRIMERS">
            <div className="grid grid-cols-1 gap-px bg-ink-3 sm:grid-cols-2 lg:grid-cols-3">
              {matchedPrimers.map((p) => (
                <Link
                  key={p.id}
                  href={`/app/education/${p.id}`}
                  className="bg-ink p-5 hover:bg-ink-2"
                >
                  <div className="font-mono text-[10px] uppercase tracking-widest2 text-amber">
                    {p.id}
                  </div>
                  <div className="mt-2 font-display text-xl text-paper">
                    {p.title}
                  </div>
                  <div className="mt-1 font-mono text-[10px] italic text-amber/60">
                    {p.framework}
                  </div>
                  <p className="mt-3 text-sm text-paper/60">{p.summary}</p>
                </Link>
              ))}
            </div>
          </Group>
        )}

        {matchedNews.length > 0 && (
          <Group n="02 /" label="NEWS">
            <div className="space-y-px bg-ink-3">
              {matchedNews.map((n) => (
                <div key={n.id} className="bg-ink p-4 hover:bg-ink-2">
                  <div className="font-mono text-[10px] uppercase tracking-widest2 text-amber">
                    {n.id}
                  </div>
                  <div className="mt-1 font-display text-lg text-paper">
                    {n.headline}
                  </div>
                  <p className="mt-1 text-sm text-paper/60">{n.analysis}</p>
                </div>
              ))}
            </div>
          </Group>
        )}

        {matchedSessions.length > 0 && (
          <Group n="03 /" label="CONSULTATION LOGS">
            <div className="space-y-px bg-ink-3">
              {matchedSessions.map((s) => (
                <div key={s.id} className="bg-ink p-4 hover:bg-ink-2">
                  <div className="flex items-baseline justify-between">
                    <div className="font-mono text-[10px] uppercase tracking-widest2 text-amber">
                      {s.id}
                    </div>
                    <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                      {formatDate(s.lastAt)} · {s.messages.length} msgs
                    </div>
                  </div>
                  <div className="mt-1 font-display text-lg text-paper">
                    {s.title}
                  </div>
                  <div className="mt-2 line-clamp-2 text-sm text-paper/60">
                    {s.messages[s.messages.length - 1]?.body}
                  </div>
                </div>
              ))}
            </div>
          </Group>
        )}

        {matchedChannel.length > 0 && (
          <Group n="04 /" label="CHANNEL POSTS">
            <div className="space-y-px bg-ink-3">
              {matchedChannel.map((p) => (
                <div key={p.id} className="bg-ink p-4 hover:bg-ink-2">
                  <div className="font-mono text-[10px] uppercase tracking-widest2 text-amber">
                    {p.id} · {formatDate(p.ts)}
                  </div>
                  <p className="mt-2 text-sm text-paper/80">{p.body}</p>
                </div>
              ))}
            </div>
          </Group>
        )}

        {total === 0 && (
          <div className="border border-ink-3 bg-ink-2 p-12 text-center font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
            No items tagged #{tag} yet. Tag will populate as content is
            published.
          </div>
        )}
      </div>
    </div>
  );
}

function Group({
  n,
  label,
  children,
}: {
  n: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <SectionNumber n={n} label={label} />
      <div className="mt-4">{children}</div>
    </section>
  );
}
