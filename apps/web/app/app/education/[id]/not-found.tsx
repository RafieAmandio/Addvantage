import Link from "next/link";

export default function PrimerNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-20">
      <div className="w-full max-w-md text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
          ● NULL TRANSMISSION
        </div>
        <h1 className="mt-4 font-display text-4xl text-white">
          Primer <span className="italic text-brand">not found</span>
        </h1>
        <p className="mt-4 font-display text-lg text-white/60">
          This education primer does not exist or may have been updated. Browse
          the library for current primers.
        </p>
        <div className="mt-8">
          <Link
            href="/app/education/primers"
            className="border border-brand/60 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-brand transition-colors hover:bg-brand hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            ← Education library
          </Link>
        </div>
      </div>
    </div>
  );
}
