import Link from "next/link";
import { listPendingNews } from "@/lib/queries/news";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminReviewQueuePage() {
  const items = await listPendingNews();

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-4xl text-paper">
          Review <span className="italic text-lime">queue</span>
        </h1>
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
          {items.length} pending
        </div>
      </div>

      {items.length === 0 && (
        <div className="border border-ink-3 bg-ink-2/40 p-12 text-center font-mono text-[10px] uppercase tracking-widest2 text-paper/50">
          ● INBOX CLEAR · no pending items
        </div>
      )}

      <div className="space-y-px bg-ink-3">
        {items.map((n) => (
          <Link
            key={n.id}
            href={`/admin/review/${n.id}`}
            className="group grid grid-cols-12 gap-6 bg-ink p-5 transition-colors hover:bg-ink-2"
          >
            <div className="col-span-12 lg:col-span-2">
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                [{n.source_code}]
              </div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                {new Date(n.fetched_at).toISOString().slice(0, 16).replace("T", " ")}
              </div>
              <div className="mt-2 flex gap-2 font-mono text-[9px] uppercase tracking-widest2">
                <span className="text-lime">{n.impact}</span>
                <span className="text-paper/50">·</span>
                <span className="text-paper/70">{n.bias}</span>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-10">
              <div className="font-display text-xl text-paper transition-colors group-hover:text-lime">
                {n.headline}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-paper/70">{n.analysis}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {n.affects.slice(0, 6).map((a: string) => (
                  <span
                    key={a}
                    className="border border-paper/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/70"
                  >
                    {a}
                  </span>
                ))}
                {n.tags.map((t: string) => (
                  <span
                    key={t}
                    className="border border-lime/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-lime"
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
