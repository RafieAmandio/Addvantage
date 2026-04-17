import Link from "next/link";
import { listRejectedNews } from "@/lib/queries/news";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminArchivePage() {
  const items = await listRejectedNews();
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-4xl text-paper">
          Rejected <span className="italic text-lime">archive</span>
        </h1>
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
          {items.length} rejected
        </div>
      </div>

      {items.length === 0 && (
        <div className="border border-ink-3 bg-ink-2/40 p-12 text-center font-mono text-[10px] uppercase tracking-widest2 text-paper/50">
          ● EMPTY · no rejected items
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
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-blood">
                [{n.source_code}]
              </div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                rejected{" "}
                {n.reviewed_at
                  ? new Date(n.reviewed_at).toISOString().slice(0, 10)
                  : "—"}
              </div>
            </div>
            <div className="col-span-12 lg:col-span-10">
              <div className="font-display text-xl text-paper/70 transition-colors group-hover:text-paper">
                {n.headline}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-paper/50">{n.analysis}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
