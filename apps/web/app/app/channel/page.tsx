import type { Metadata } from "next";
import type { ChannelPost } from "@/features/channel/types";

export const metadata: Metadata = { title: "Channel" };
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import { formatDate, formatTime } from "@/lib/cn";
import Link from "next/link";

const posts: ChannelPost[] = [];

export default function ChannelPage() {
  return (
    <div className="stagger bg-grid">
      <div className="border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-baseline justify-between">
            <div>
              <DataLabel>Transmission TX-06 · Free pillar</DataLabel>
              <h1 className="mt-2 font-display text-5xl text-white">
                My <span className="italic text-brand">Channel</span>
              </h1>
              <p className="mt-2 max-w-2xl font-display text-lg text-white/60">
                Founder broadcast. Daily takes. No replies, no comments, no
                debate. Read or scroll past.
              </p>
            </div>
            <div className="hidden text-right font-mono text-[10px] uppercase tracking-widest2 text-white/40 lg:block">
              <div>ANTHONY</div>
              <div>FOUNDING OPERATOR</div>
              <div className="mt-2 text-moss">● BROADCASTING</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <SectionNumber n="—" label={`${posts.length} POSTS`} />

        {posts.length === 0 && (
          <div className="mt-10 border border-gray-3 bg-gray-2/30 px-6 py-12 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
              NO BROADCASTS YET
            </p>
            <p className="mt-2 font-display text-lg text-white/60">
              Channel posts will appear here once broadcasting begins.
            </p>
          </div>
        )}

        <div className="mt-6 space-y-10">
          {posts.map((p) => (
            <article
              key={p.id}
              className="relative border-l-2 border-brand/40 pl-6"
            >
              <div className="absolute -left-1.5 top-1.5 h-3 w-3 bg-brand" />
              <div className="flex flex-wrap items-baseline gap-3 font-mono text-[10px] uppercase tracking-widest2">
                <span className="text-brand">{p.id}</span>
                <span className="text-white/40">·</span>
                <span className="text-white/60">
                  {formatDate(p.ts)} · {formatTime(p.ts)}Z
                </span>
                <span className="text-white/40">·</span>
                <span className="text-brand">BY {p.author.toUpperCase()}</span>
              </div>
              <p className="mt-3 font-display text-xl leading-snug text-white">
                {p.body}
              </p>
              {p.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <Link
                      key={t}
                      href={`/app/tags/${t}`}
                      className="font-mono text-[10px] uppercase tracking-widest2 text-brand/70 transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
