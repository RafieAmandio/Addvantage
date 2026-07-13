import Link from "next/link";

// Public sign-up is invite-only for now: early access is the only way in.
// Shown at /signup when NEXT_PUBLIC_REGISTRATION_OPEN !== "1".
export function RegistrationClosed() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-6 text-center text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black via-transparent to-black"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-xl">
        <Link href="/" className="font-mono text-base font-bold text-white">
          +vantage
        </Link>

        <div
          className="mt-12 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-widest2 text-brand"
          style={{ animation: "fadeSlideUp 0.5s ease-out both" }}
        >
          <span className="led animate-pulse" aria-hidden />
          Registration // Invite only
        </div>

        <h1
          className="mt-6 font-sans text-[clamp(2.75rem,9vw,80px)] font-bold leading-[0.95] text-white"
          style={{ animation: "fadeSlideUp 0.5s ease-out 0.1s both" }}
        >
          Invite
          <br />
          only<span className="text-brand">.</span>
        </h1>

        <p
          className="mx-auto mt-6 max-w-md font-mono text-sm leading-[1.6] text-white/60"
          style={{ animation: "fadeSlideUp 0.5s ease-out 0.2s both" }}
        >
          Public sign-up is paused. The only way in right now is early access: a founding cohort with a 100% money-back guarantee.
        </p>

        <div
          className="mt-10 flex flex-col items-center gap-5"
          style={{ animation: "fadeSlideUp 0.5s ease-out 0.3s both" }}
        >
          <Link
            href="/early-access"
            className="btn-pixel rounded-lg bg-brand px-8 py-4 font-mono text-sm font-bold text-black transition-colors hover:bg-brand-dim"
          >
            Request early access &rarr;
          </Link>
          <Link
            href="/login"
            className="font-mono text-sm text-white/50 transition-colors hover:text-brand"
          >
            Already an operator? Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
