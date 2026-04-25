import Link from "next/link";
import { listRejectedNews } from "@/features/news/queries/news";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminArchivePage() {
  const items = await listRejectedNews();
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-4xl text-white">
          Rejected <span className="italic text-brand">archive</span>
        </h1>
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
          {items.length} rejected
        </div>
      </div>

      {items.length === 0 && (
        <div className="border border-gray-3 bg-gray-2/40 p-12 text-center font-mono text-[10px] uppercase tracking-widest2 text-white/50">
          ● EMPTY · no rejected items
        </div>
      )}

      <div className="space-y-px bg-gray-3">
        {items.map((n) => (
          <Link
            key={n.id}
            href={`/admin/review/${n.id}`}
            className="group grid grid-cols-12 gap-6 text-black p-5 transition-colors hover:bg-gray-2"
          >
            <div className="col-span-12 lg:col-span-2">
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-red-500">
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
