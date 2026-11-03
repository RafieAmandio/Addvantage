import Link from "next/link";

export default function AdminPlanNotFound() {
  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-md rounded-2xl bg-panel p-6 text-center">
        <h1 className="text-[17px] font-semibold text-white">Plan not found</h1>
        <p className="mt-1 text-[14px] text-white/55">This plan does not exist or has been deleted.</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/admin/plans"
            className="inline-flex h-10 items-center rounded-full border border-white/[0.14] px-4 text-[13px] font-medium text-white transition-colors hover:bg-raised"
          >
            All plans
          </Link>
          <Link
            href="/admin/plans/new"
            className="inline-flex h-10 items-center rounded-full bg-brand px-4 text-[13px] font-semibold text-black transition-opacity hover:opacity-90"
          >
            New plan
          </Link>
        </div>
      </div>
    </div>
  );
}
