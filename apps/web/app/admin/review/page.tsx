import Link from "next/link";
import { listPendingNews } from "@/features/news/queries/news";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminReviewQueuePage() {
  const items = await listPendingNews();

  return (
    <div className="stagger mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-4xl text-white">
          Review <span className="italic text-brand">queue</span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
            {items.length} pending
          </span>
          <Link
            href="/admin/review/new"
            className="border border-brand/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black"
          >
            + New item
          </Link>
        </div>
      </div>

      {items.length === 0 && (
        <div className="border border-gray-3 bg-gray-2/30 p-12 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-emerald-400">
            ● INBOX CLEAR
          </div>
          <div className="mt-3 font-display text-2xl text-white">
            No items pending review.
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
            New items appear here after the worker ingests and rephrases a
            source. Check the logs for recent pipeline runs.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/admin/logs"
              className="border border-brand/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black"
            >
              View pipeline logs →
            </Link>
            <Link
              href="/admin/sources"
              className="border border-gray-3 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-white/60 hover:border-white/40 hover:text-white"
            >
              Check sources
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-px bg-gray-3">
        {items.map((n) => (
          <Link
            key={n.id}
            href={`/admin/review/${n.id}`}
            className="group grid grid-cols-12 gap-6 bg-black p-5 transition-all hover:-translate-y-px hover:bg-gray-2"
          >
            <div className="col-span-12 lg:col-span-2">
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                [{n.source_code}]
              </div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                {new Date(n.fetched_at).toISOString().slice(0, 16).replace("T", " ")}
              </div>
              <div className="mt-2 flex gap-2 font-mono text-[9px] uppercase tracking-widest2">
                <span className="text-brand">{n.impact}</span>
                <span className="text-white/50">·</span>
                <span className="text-white/70">{n.bias}</span>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-10">
              <div className="font-display text-xl text-white transition-colors group-hover:text-brand">
                {n.headline}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-white/70">{n.analysis}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {n.affects.slice(0, 6).map((a: string) => (
                  <span
                    key={a}
                    className="border border-white/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/70"
                  >
                    {a}
                  </span>
                ))}
                {n.tags.map((t: string) => (
                  <span
                    key={t}
                    className="border border-brand/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-brand"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
