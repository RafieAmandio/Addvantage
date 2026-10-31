import Link from "next/link";

export default function PlanNotFound() {
  return (
    <div className="px-4 pb-10 sm:px-6">
      <div className="mx-auto max-w-md rounded-2xl bg-panel p-8 text-center">
        <p className="text-[17px] font-medium text-white">Plan not found</p>
        <p className="mt-1 text-[14px] text-white/55">This plan does not exist or has not been published yet.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/app/plan" className="rounded-full bg-brand px-4 py-1.5 text-[13px] font-semibold text-black transition-opacity hover:opacity-90">
            Current plan
          </Link>
        <Link href="/app/plan/archive" className="rounded-full border border-white/[0.14] px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-raised">
          Browse archive
        </Link>
        </div>
      </div>
    </div>
  );
}
