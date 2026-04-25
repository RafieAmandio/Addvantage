import Link from "next/link";

export function WatchlistEmpty() {
  return (
    <div className="border border-gray-3 bg-gray-2/40 p-12 text-center">
      <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
        ● WATCHLIST EMPTY
      </div>
      <div className="mt-3 font-display text-3xl text-paper">No pins yet.</div>
      <p className="mt-3 max-w-md mx-auto font-display text-base text-paper/60">
        Pin an instrument from any news item's{" "}
        <span className="text-lime">Affects</span> list or from the{" "}
        <span className="text-lime">Trading Plan</span> setup cards. It will
        show up here with its history, live setups, and news mentions.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          href="/app/news"
          className="border border-lime/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-lime hover:bg-brand hover:text-ink"
        >
          Browse news →
        </Link>
        <Link
          href="/app/plan"
          className="border border-lime/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-lime hover:bg-brand hover:text-ink"
        >
          Open live plan →
        </Link>
      </div>
    </div>
  );
}
