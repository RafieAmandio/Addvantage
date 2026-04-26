import Link from "next/link";
import { listRejectedNews } from "@/features/news/queries/news";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminArchivePage() {
  const items = await listRejectedNews();
  return (
    <div className="stagger mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-4xl text-white">
          Rejected <span className="italic text-brand">archive</span>
        </h1>
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
          {items.length} rejected
        </div>
      </div>

      {items.length === 0 && (
        <div className="border border-gray-3 bg-gray-2/30 p-12 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
            ● ARCHIVE EMPTY
          </div>
          <div className="mt-3 font-display text-2xl text-white">
            No rejected items yet.
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
            Items rejected during review appear here. Rejected items are
            hidden from the public feed but preserved for audit.
          </p>
          <div className="mt-6">
            <Link
              href="/admin/review"
              className="border border-brand/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-brand transition-colors hover:bg-brand hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              ← Back to review queue
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-px bg-gray-3">
        {items.map((n) => (
          <Link
            key={n.id}
            href={`/admin/review/${n.id}`}
            className="group grid grid-cols-12 gap-6 bg-black p-5 transition-all hover:-translate-y-px hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            <div className="col-span-12 lg:col-span-2">
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-blood-bright">
                [{n.source_code}]
              </div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                rejected{" "}
                {n.reviewed_at
                  ? new Date(n.reviewed_at).toISOString().slice(0, 10)
                  : "—"}
              </div>
            </div>
            <div className="col-span-12 lg:col-span-10">
              <div className="font-display text-xl text-white/70 transition-colors group-hover:text-white">
                {n.headline}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-white/50">{n.analysis}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
