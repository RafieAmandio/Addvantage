import Link from "next/link";
import { listAllPlansForAdmin } from "@/features/plan/queries/plans";
import { PlanAdminListTable } from "@/features/plan/components/admin/PlanAdminListTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPlansPage() {
  const plans = await listAllPlansForAdmin(100);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-4xl text-paper">
          Trading <span className="italic text-lime">plans</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
            {plans.length} total
          </div>
          <Link
            href="/admin/plans/new"
            className="border border-lime bg-lime px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-ink hover:bg-paper"
          >
            + New plan
          </Link>
        </div>
      </div>

      <PlanAdminListTable plans={plans} />
    </div>
  );
}
