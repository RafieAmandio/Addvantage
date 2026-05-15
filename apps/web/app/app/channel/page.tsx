import type { Metadata } from "next";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import { formatDate, formatTime } from "@/lib/cn";
import { apiGet } from "@/lib/api/client-server";
import Link from "next/link";

export const metadata: Metadata = { title: "Channel" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ChannelPost {
  id: string;
  author: string;
  body: string;
  image_url: string | null;
  tags: string[];
  pinned: boolean;
  created_at: string;
}

export default async function ChannelPage() {
  let posts: ChannelPost[] = [];
  try {
    posts = (await apiGet<ChannelPost[]>("/channel")) ?? [];
  } catch {
    posts = [];
  }

  return (
    <div className="stagger bg-grid">
      <div className="border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-baseline justify-between">
            <div>
              <DataLabel>Channel</DataLabel>
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
                <span className="text-white/60">
                  {formatDate(p.created_at)} · {formatTime(p.created_at)}Z
                </span>
                <span className="text-white/40">·</span>
                <span className="text-brand">BY {p.author.toUpperCase()}</span>
                {p.pinned && (
                  <>
                    <span className="text-white/40">·</span>
                    <span className="text-brand/60">PINNED</span>
                  </>
                )}
              </div>
              <p className="mt-3 font-display text-xl leading-snug text-white whitespace-pre-wrap">
                {p.body}
              </p>
              {p.image_url && (
                <div className="mt-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image_url}
                    alt=""
                    className="max-w-full rounded border border-gray-3"
                  />
                </div>
              )}
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
