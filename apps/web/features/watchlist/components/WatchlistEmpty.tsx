import Link from "next/link";

export function WatchlistEmpty() {
  return (
    <div className="border border-gray-3 bg-gray-2/40 p-12 text-center">
      <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
        ● WATCHLIST EMPTY
      </div>
      <div className="mt-3 font-display text-3xl text-white">No pins yet.</div>
      <p className="mt-3 max-w-md mx-auto font-display text-base text-white/60">
        Pin an instrument from any news item's{" "}
        <span className="text-brand">Affects</span> list or from the{" "}
        <span className="text-brand">Trading Plan</span> setup cards. It will
        show up here with its history, live setups, and news mentions.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          href="/app/news"
          className="border border-brand/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
        >
          Browse news →
        </Link>
        <Link
          href="/app/plan"
          className="border border-brand/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
        >
          Open live plan →
        </Link>
      </div>
    </div>
  );
}
