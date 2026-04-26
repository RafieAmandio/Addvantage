import Link from "next/link";

export default function CalendarEventNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-20">
      <div className="w-full max-w-md text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
          ● NULL TRANSMISSION
        </div>
        <h1 className="mt-4 font-display text-4xl text-white">
          Event <span className="italic text-brand">not found</span>
        </h1>
        <p className="mt-4 font-display text-lg text-white/60">
          This economic event does not exist or has been removed from the
          calendar.
        </p>
        <div className="mt-8">
          <Link
            href="/app/calendar"
            className="border border-brand/60 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-brand transition-colors hover:bg-brand hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            ← Back to calendar
          </Link>
        </div>
      </div>
    </div>
  );
}
