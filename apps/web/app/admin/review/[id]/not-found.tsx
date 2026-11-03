import Link from "next/link";

export default function ReviewItemNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-panel p-6 text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">Item not found</p>
        <h1 className="mt-2 text-[22px] font-semibold text-white">This review item is missing</h1>
        <p className="mt-2 text-[14px] leading-[21px] text-white/55">
          It does not exist, or it was already reviewed and moved out of the queue.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/admin/review"
            className="inline-flex h-10 items-center rounded-full bg-brand px-4 text-[13px] font-semibold text-black transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            Review queue
          </Link>
          <Link
            href="/admin/archive"
            className="inline-flex h-10 items-center rounded-full border border-white/[0.14] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            Check archive
          </Link>
        </div>
      </div>
    </div>
  );
}
