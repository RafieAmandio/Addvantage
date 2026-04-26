import Link from "next/link";

export default function NewsItemNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-md text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
          ● NULL TRANSMISSION
        </div>
        <h1 className="mt-4 font-display text-4xl text-white">
          Item <span className="italic text-brand">not found</span>
        </h1>
        <p className="mt-4 font-display text-lg text-white/60">
          This news item does not exist or has been removed from the feed.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/app/news"
            className="border border-brand/60 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-brand transition-colors hover:bg-brand hover:text-black"
          >
            ← Back to news feed
          </Link>
        </div>
      </div>
    </div>
  );
}
