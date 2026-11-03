import type { Metadata } from "next";
import Link from "next/link";
import { listRejectedNews } from "@/features/news/queries/news";
import { formatDate } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";

export const metadata: Metadata = { title: "Archive" };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminArchivePage() {
  const items = await listRejectedNews();
  return (
    <div className="space-y-4">
      <Panel
        title="Rejected archive"
        sub={`${items.length} rejected. Hidden from the public feed, kept for audit.`}
      >
        {items.length === 0 ? (
          <div className="rounded-xl bg-raised px-5 py-12 text-center">
            <p className="text-[15px] font-medium text-white">No rejected items yet.</p>
            <p className="mt-1 text-[13px] text-white/55">Items rejected during review appear here.</p>
            <Link
              href="/admin/review"
              className="mt-5 inline-flex h-9 items-center rounded-full border border-white/[0.14] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              Back to review queue
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.07]">
            {items.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/admin/review/${n.id}`}
                  className="group flex gap-4 py-3.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
                      {n.sourceCode}
                      <span className="px-1.5 text-white/20">/</span>
                      <span className="text-down">Rejected</span>
                      <span className="font-medium normal-case tracking-normal">
                        {n.reviewedAt ? ` ${formatDate(n.reviewedAt)}` : ""}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[15px] font-medium leading-[21px] text-white/70 transition-colors group-hover:text-white">
                      {n.headline}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[13px] leading-[19px] text-white/45">{n.analysis}</p>
                  </div>
                  <span className="hidden shrink-0 self-center text-[13px] font-medium text-white/30 transition-colors group-hover:text-white sm:block">
                    Open
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
