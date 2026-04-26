import Link from "next/link";

export default function AdminPlanNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-20">
      <div className="w-full max-w-md text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
          ● PLAN NOT FOUND
        </div>
        <h1 className="mt-4 font-display text-4xl text-white">
          Plan <span className="italic text-brand">missing</span>
        </h1>
        <p className="mt-4 font-display text-lg text-white/60">
          This plan does not exist or has been deleted.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/admin/plans"
            className="border border-brand/60 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-brand transition-colors hover:bg-brand hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            ← All plans
          </Link>
          <Link
            href="/admin/plans/new"
            className="border border-gray-3 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-white/40 hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            Create new plan
          </Link>
        </div>
      </div>
    </div>
  );
}
