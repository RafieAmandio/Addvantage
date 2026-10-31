import type { Metadata } from "next";
import Link from "next/link";
import { listAllPlansForAdmin } from "@/features/plan/queries/plans";
import { Panel } from "@/components/ui/Panel";
import { PlanAdminListTable } from "@/features/plan/components/admin/PlanAdminListTable";

export const metadata: Metadata = { title: "Plans" };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPlansPage() {
  const plans = await listAllPlansForAdmin(100);
  const count = (s: string) => plans.filter((p) => p.status === s).length;

  return (
    <div className="space-y-4">
      <Panel
        title="Trading plans"
        sub={`${plans.length} total · ${count("published")} published · ${count("draft")} draft · ${count("closed")} closed`}
        action={
          <Link
            href="/admin/plans/new"
            className="inline-flex h-9 items-center rounded-full bg-brand px-4 text-[13px] font-semibold text-black transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            New plan
          </Link>
        }
      >
        <PlanAdminListTable plans={plans} />
      </Panel>
    </div>
  );
}
