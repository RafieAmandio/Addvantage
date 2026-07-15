import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { listAllReportsForAdmin } from "@/features/reports/admin/queries";
import { togglePublished } from "@/features/reports/admin/actions";
import { formatReportDate, thumbnailUrl } from "@/features/reports/types";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminReportsPage() {
  await requireAdmin();
  const reports = await listAllReportsForAdmin();

  return (
    <div className="stagger mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-4xl text-white">
          Class <span className="italic text-brand">reports</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
            {reports.length} total
          </div>
          <Link
            href="/admin/reports/new"
            className="border border-brand bg-brand px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            + New report
          </Link>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="flex min-h-[20vh] items-center justify-center border border-gray-3 bg-black font-mono text-[10px] uppercase tracking-widest2 text-white/40">
          No reports yet — create the first one
        </div>
      ) : (
        <div className="border-t border-gray-3">
          {reports.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[96px_1fr_auto_auto] items-center gap-4 border-b border-gray-3 bg-black px-4 py-3 sm:gap-6 sm:px-6"
            >
              <div className="aspect-[4/3] overflow-hidden border border-white/[0.06]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnailUrl(r.driveId)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div className="min-w-0">
                <Link
                  href={`/admin/reports/${r.id}`}
                  className="truncate font-display text-lg text-white transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                >
                  {r.title}
                </Link>
                <div className="mt-0.5 flex flex-wrap gap-x-3 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                  {r.publishedAt && <span>{formatReportDate(r.publishedAt)}</span>}
                  <span>#{r.sortOrder}</span>
                  <span className="text-white/25">{r.slug}</span>
                </div>
              </div>
              <form action={togglePublished.bind(null, r.id, !r.published)}>
                <button
                  type="submit"
                  className={
                    r.published
                      ? "border border-moss/50 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-moss transition-colors hover:bg-moss/10 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                      : "border border-gray-3 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-white/40 transition-colors hover:border-white/30 hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                  }
                >
                  {r.published ? "● Published" : "○ Draft"}
                </button>
              </form>
              <Link
                href={`/admin/reports/${r.id}`}
                className="font-mono text-[10px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
              >
                Edit →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
