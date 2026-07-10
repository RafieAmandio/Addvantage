import Link from "next/link";

// Shown while NEXT_PUBLIC_EARLY_ACCESS_OPEN !== "1". Hard gate: the intake flow
// is never rendered, so no one can register until enrollment is opened.
export function EarlyAccessClosed() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-white">
      <div className="w-full max-w-lg">
        <Link href="/" className="font-mono text-base font-bold text-white">
          +vantage
        </Link>

        <div className="mt-12 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-widest2 text-brand">
          <span className="led animate-pulse" aria-hidden />
          Early Access // Standby
        </div>

        <h1 className="mt-6 font-sans text-[clamp(2.5rem,8vw,64px)] font-bold leading-[1.0] text-white">
          Not open
          <br />
          yet
          <span
            aria-hidden
            className="ml-1 inline-block h-[0.8em] w-[0.5ch] translate-y-[0.05em] animate-blink bg-brand align-baseline"
          />
        </h1>

        <p className="mx-auto mt-6 max-w-md font-mono text-sm leading-[1.6] text-white/60">
          Enrollment is sealed. Founding early access opens shortly. If you were sent here, hold tight; your window is coming.
        </p>

        <Link
          href="/"
          className="mt-10 inline-block font-mono text-sm text-white/60 transition-colors hover:text-brand"
        >
          &larr; Back to TradeVantage
        </Link>
      </div>
    </main>
  );
}
