import Link from "next/link";

export default function ReviewItemNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-md text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
          ● ITEM NOT FOUND
        </div>
        <h1 className="mt-4 font-display text-4xl text-white">
          Review item <span className="italic text-brand">missing</span>
        </h1>
        <p className="mt-4 font-display text-lg text-white/60">
          This item does not exist or has already been reviewed and moved out of
          the queue.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/admin/review"
            className="border border-brand/60 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-brand transition-colors hover:bg-brand hover:text-black"
          >
            ← Review queue
          </Link>
          <Link
            href="/admin/archive"
            className="border border-gray-3 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-white/40 hover:text-white"
          >
            Check archive
          </Link>
        </div>
      </div>
    </div>
  );
}
