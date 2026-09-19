import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { listBulletinsForAdmin } from "@/features/bulletin/admin/queries";

export const metadata: Metadata = { title: "Bulletin" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  watching: "Watching",
};

export default async function AdminBulletinPage() {
  await requireAdmin();
  const bulletins = await listBulletinsForAdmin();

  return (
    <div className="stagger mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-4xl text-white">
          Bulletin <span className="italic text-brand">board</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
            {bulletins.length} total
          </div>
          <Link
            href="/admin/bulletin/new"
            className="border border-brand bg-brand px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            + New instrument
          </Link>
        </div>
      </div>

      {bulletins.length === 0 ? (
        <div className="flex min-h-[20vh] items-center justify-center border border-gray-3 bg-black font-mono text-[10px] uppercase tracking-widest2 text-white/40">
          No instruments yet — add the first
        </div>
      ) : (
        <div className="border-t border-gray-3">
          {bulletins.map((b) => (
            <Link
              key={b.id}
              href={`/admin/bulletin/${b.id}`}
              className="grid grid-cols-[6rem_1fr_auto_auto] items-center gap-4 border-b border-gray-3 bg-black px-4 py-3 transition-colors hover:bg-white/[0.02] sm:gap-6 sm:px-6"
            >
              <span className="font-mono text-sm font-bold uppercase tracking-widest2 text-white">
                {b.symbol}
              </span>
              <span className="truncate font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                {STATUS_LABEL[b.status] ?? b.status} · {b.bias}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/30">
                {b.levels.length} tf
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                Edit →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
