import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { listBulletinsForAdmin } from "@/features/bulletin/admin/queries";
import { Panel } from "@/components/ui/Panel";
import { BiasBadge } from "@/components/ui/Marker";
import { StructureStrip } from "@/features/bulletin/components/StructureStrip";

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
    <div className="space-y-4">
      <Panel
        title="Bulletin board"
        sub={`${bulletins.length} instruments`}
        action={
          <Link
            href="/admin/bulletin/new"
            className="inline-flex h-9 items-center rounded-full bg-brand px-4 text-[13px] font-semibold text-black transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            New instrument
          </Link>
        }
      >
        {bulletins.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-white/40">No instruments yet. Add the first one.</p>
        ) : (
          <div className="-mx-5 divide-y divide-white/[0.07] border-t border-white/[0.07]">
            {bulletins.map((b) => (
              <Link
                key={b.id}
                href={`/admin/bulletin/${b.id}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-brand md:grid-cols-[8rem_7rem_minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <div className="font-num text-[20px] font-semibold uppercase leading-tight text-white">{b.symbol}</div>
                  <div className="text-[12px] text-white/55 md:hidden">
                    {STATUS_LABEL[b.status] ?? b.status} · {b.levels.length} timeframes
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className={b.status === "active" ? "text-[13px] font-medium text-brand" : "text-[13px] font-medium text-white/55"}>
                    {STATUS_LABEL[b.status] ?? b.status}
                  </div>
                  <BiasBadge bias={b.bias} />
                </div>
                <div className="hidden max-w-[420px] md:block">
                  <StructureStrip levels={b.levels} size={18} showBos={false} />
                </div>
                <div className="flex items-center gap-3">
                  <span className="md:hidden">
                    <BiasBadge bias={b.bias} />
                  </span>
                  <span className="rounded-full border border-white/[0.14] px-3 py-1 text-[12px] font-medium text-white">Edit</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
