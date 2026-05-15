import type { Metadata } from "next";
import Link from "next/link";
import { listPendingNews } from "@/features/news/queries/news";
import { formatDateTime } from "@/lib/cn";

export const metadata: Metadata = { title: "Review Queue" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminReviewQueuePage() {
  const items = await listPendingNews();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
            Inbound · Pending Review
          </span>
          <h1 className="mt-2 font-mono text-2xl font-bold text-white">
            Review Queue
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-white/30">
            {items.length} pending
          </span>
          <Link
            href="/admin/review/new"
            className="bg-brand px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-brand-dim hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            + New item
          </Link>
        </div>
      </div>

      <div className="mt-8 h-px bg-white/20" />

      {items.length === 0 && (
        <div className="py-20 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-moss">
            ● Inbox Clear
          </div>
          <div className="mt-4 font-mono text-xl font-bold text-white">
            No items pending review.
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-white/30">
            New items appear here after the worker ingests and rephrases a
            source.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/admin/logs"
              className="bg-brand px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-brand-dim hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              Pipeline logs →
            </Link>
            <Link
              href="/admin/sources"
              className="border border-white/20 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              Check sources
            </Link>
          </div>
        </div>
      )}

      <div className="mt-px">
        {items.map((n, i) => (
          <Link
            key={n.id}
            href={`/admin/review/${n.id}`}
            className="group grid grid-cols-12 gap-4 border-b border-white/[0.08] py-6 transition-all hover:bg-white/[0.02] focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none sm:gap-6"
          >
            <div className="col-span-12 lg:col-span-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] tabular-nums text-white/20">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                  [{n.source_code}]
                </span>
              </div>
              <div className="mt-2 pl-7 font-mono text-[9px] uppercase tracking-widest2 text-white/30">
                {formatDateTime(n.fetched_at)}
              </div>
              <div className="mt-2 flex gap-2 pl-7 font-mono text-[9px] uppercase tracking-widest2">
                <span className="text-brand">{n.impact}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/50">{n.bias}</span>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-10">
              <div className="font-mono text-lg font-bold text-white transition-colors group-hover:text-brand">
                {n.headline}
              </div>
              <p className="mt-2 line-clamp-2 font-mono text-sm font-light leading-relaxed text-white/60">
                {n.analysis}
              </p>
              {(n.affects.length > 0 || n.tags.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {n.affects.slice(0, 6).map((a: string) => (
                    <span
                      key={a}
                      className="border border-white/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/50"
                    >
                      {a}
                    </span>
                  ))}
                  {n.tags.map((t: string) => (
                    <span
                      key={t}
                      className="border border-brand/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-brand/70"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
