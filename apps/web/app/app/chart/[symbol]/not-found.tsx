import Link from "next/link";

export default function ChartNotFound() {
  return (
    <div className="px-4 pb-10 sm:px-6">
      <div className="mx-auto max-w-md rounded-2xl bg-panel p-8 text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">Symbol not found</p>
        <h1 className="mt-2 text-[22px] font-semibold text-white">Unknown instrument</h1>
        <p className="mt-2 text-[15px] leading-[22px] text-white/55">This symbol has no chart. Try SPX, BTC, ETH, DXY or GOLD.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/app/chart/SPX"
            className="rounded-full bg-brand px-4 py-2 text-[14px] font-semibold text-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            SPX chart
          </Link>
          <Link
            href="/app"
            className="rounded-full border border-white/[0.14] px-4 py-2 text-[14px] font-medium text-white hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
