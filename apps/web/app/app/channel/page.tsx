import { channelPosts } from "@/lib/mock/channel";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import { formatDate, formatTime } from "@/lib/cn";
import Link from "next/link";

export default function ChannelPage() {
  return (
    <div>
      <div className="border-b border-ink-3 bg-ink-2/30">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex items-baseline justify-between">
            <div>
              <DataLabel>Transmission TX-06 · Free pillar</DataLabel>
              <h1 className="mt-2 font-display text-5xl text-paper">
                My <span className="italic text-lime">Channel</span>
              </h1>
              <p className="mt-2 max-w-2xl font-display text-lg text-paper/60">
                Founder broadcast. Daily takes. No replies, no comments, no
                debate. Read or scroll past.
              </p>
            </div>
            <div className="hidden text-right font-mono text-[10px] uppercase tracking-widest2 text-paper/40 lg:block">
              <div>ANTHONY</div>
              <div>FOUNDING OPERATOR</div>
              <div className="mt-2 text-moss">● BROADCASTING</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <SectionNumber n="—" label={`${channelPosts.length} POSTS`} />

        <div className="mt-6 space-y-10">
          {channelPosts.map((p, i) => (
            <article
              key={p.id}
              className="relative border-l-2 border-lime/40 pl-6"
            >
              <div className="absolute -left-1.5 top-1.5 h-3 w-3 bg-lime" />
              <div className="flex flex-wrap items-baseline gap-3 font-mono text-[10px] uppercase tracking-widest2">
                <span className="text-lime">{p.id}</span>
                <span className="text-paper/40">·</span>
                <span className="text-paper/60">
                  {formatDate(p.ts)} · {formatTime(p.ts)}Z
                </span>
                <span className="text-paper/40">·</span>
                <span className="text-lime">BY {p.author.toUpperCase()}</span>
              </div>
              <p className="mt-3 font-display text-xl leading-snug text-paper">
                {p.body}
              </p>
              {p.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <Link
                      key={t}
                      href={`/app/tags/${t}`}
                      className="font-mono text-[10px] uppercase tracking-widest2 text-lime/70 hover:text-lime"
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
