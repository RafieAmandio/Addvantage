import type { Metadata } from "next";
import { Panel } from "@/components/ui/Panel";
import { cn, formatDate, formatWibTime } from "@/lib/cn";
import { apiGet } from "@/lib/api/client-server";
import Link from "next/link";
import { ChannelThreadNav } from "./ChannelThreadNav";

export const metadata: Metadata = { title: "Channel" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ChannelThread {
  id: string;
  title: string;
  slug: string;
  description: string | null;
}

interface ChannelPost {
  id: string;
  author: string;
  body: string;
  imageUrl: string | null;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  thread: { id: string; title: string; slug: string } | null;
}

export default async function ChannelPage({
  searchParams,
}: {
  searchParams: { thread?: string };
}) {
  let threads: ChannelThread[] = [];
  let posts: ChannelPost[] = [];
  const activeSlug = searchParams.thread ?? null;

  try {
    threads = (await apiGet<ChannelThread[]>("/channel/threads")) ?? [];
  } catch {
    threads = [];
  }

  const activeThread = activeSlug
    ? threads.find((t) => t.slug === activeSlug) ?? null
    : null;

  try {
    const query = activeThread ? `?threadId=${activeThread.id}` : "";
    posts = (await apiGet<ChannelPost[]>(`/channel${query}`)) ?? [];
  } catch {
    posts = [];
  }

  const pinned = posts.filter((p) => p.pinned).length;

  return (
    <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        <Panel
          title={activeThread ? activeThread.title : "All posts"}
          sub={activeThread?.description ?? `${posts.length} ${posts.length === 1 ? "post" : "posts"}, newest first`}
        >
          {threads.length > 0 && <ChannelThreadNav threads={threads} activeSlug={activeSlug} />}

          {posts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[17px] font-medium text-white">{activeThread ? "No posts in this thread" : "No broadcasts yet"}</p>
              <p className="mt-1 text-[14px] text-white/40">
                {activeThread ? "Posts assigned to this thread will appear here." : "Channel posts appear here once broadcasting begins."}
              </p>
            </div>
          ) : (
            <ul className={cn("divide-y divide-white/[0.07]", threads.length > 0 && "mt-2")}>
              {posts.map((p) => (
                <li key={p.id} className="py-5">
                  <article className="max-w-[68ch]">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
                      {formatDate(p.createdAt)} · {formatWibTime(p.createdAt)} WIB
                      <span className="px-1.5 text-white/20">/</span>
                      <span className="text-white/70">{p.author}</span>
                      {p.pinned && <span className="ml-2 text-brand">Pinned</span>}
                      {p.thread && !activeThread && (
                        <>
                          <span className="px-1.5 text-white/20">/</span>
                          <Link href={`/app/channel?thread=${p.thread.slug}`} className="transition-colors hover:text-white">
                            {p.thread.title}
                          </Link>
                        </>
                      )}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-[16px] leading-[26px] text-white/90">{p.body}</p>
                    {p.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="mt-4 max-h-[420px] max-w-full rounded-xl object-contain" />
                    )}
                    {p.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.tags.map((t) => (
                          <Link
                            key={t}
                            href={`/app/tags/${t}`}
                            className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] text-white/60 transition-colors hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                          >
                            #{t}
                          </Link>
                        ))}
                      </div>
                    )}
                  </article>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel title="Founder broadcast" sub="Anthony, founding operator">
          <p className="text-[14px] leading-[21px] text-white/70">Daily takes from the founder. No replies, no comments, no debate. Read or scroll past.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
              <div className="font-num text-[32px] font-semibold leading-8 text-white">{posts.length}</div>
              <div className="mt-0.5 text-[12px] text-white/40">{activeThread ? "In thread" : "Posts"}</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
              <div className={cn("font-num text-[32px] font-semibold leading-8", pinned ? "text-brand" : "text-white")}>{pinned}</div>
              <div className="mt-0.5 text-[12px] text-white/40">Pinned</div>
            </div>
          </div>
          {posts[0] && <p className="mt-3 text-[13px] text-white/40">Last post {formatDate(posts[0].createdAt)}, {formatWibTime(posts[0].createdAt)} WIB</p>}
        </Panel>

        {threads.length > 0 && (
          <Panel title="Threads" sub="Ongoing series">
            <ul className="-my-1 divide-y divide-white/[0.07]">
              {threads.map((t) => (
                <li key={t.id}>
                  <Link
                    href={activeSlug === t.slug ? "/app/channel" : `/app/channel?thread=${t.slug}`}
                    className="group block py-2.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                  >
                    <span className={cn("text-[14px] font-semibold", activeSlug === t.slug ? "text-brand" : "text-white group-hover:text-brand")}>{t.title}</span>
                    {t.description && <span className="mt-0.5 line-clamp-2 block text-[13px] leading-[18px] text-white/45">{t.description}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </aside>
    </div>
  );
}
