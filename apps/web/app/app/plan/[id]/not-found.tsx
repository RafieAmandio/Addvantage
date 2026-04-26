import Link from "next/link";

export default function PlanNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-20">
      <div className="w-full max-w-md text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
          ● NULL TRANSMISSION
        </div>
        <h1 className="mt-4 font-display text-4xl text-white">
          Plan <span className="italic text-brand">not found</span>
        </h1>
        <p className="mt-4 font-display text-lg text-white/60">
          This plan does not exist or has not been published yet.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/app/plan"
            className="border border-brand/60 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-brand transition-colors hover:bg-brand hover:text-black"
          >
            ← Current plan
          </Link>
          <Link
            href="/app/plan/archive"
            className="border border-gray-3 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-white/40 hover:text-white"
          >
            Browse archive
          </Link>
        </div>
      </div>
    </div>
  );
}
