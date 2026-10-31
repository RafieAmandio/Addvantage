import Link from "next/link";

export function PaywallOverlay({
  surface,
  reason,
}: {
  surface: string;
  reason?: string;
}) {
  return (
    <div className="relative" role="region" aria-label={`${surface} — upgrade required`}>
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/0 via-black/85 to-black" aria-hidden="true" />
      <div className="absolute inset-x-0 top-1/2 z-20 mx-auto max-w-md -translate-y-1/2 rounded-2xl bg-panel p-6 ring-1 ring-white/[0.08] sm:p-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand">VIP+ required</p>
        <h3 className="mt-2 font-num text-[30px] font-semibold leading-8 text-white">
          {surface}
        </h3>
        <p className="mt-2 text-[15px] leading-[22px] text-white/55">
          {reason ||
            `Private consultation with the AI and the desk is restricted to VIP+ Trader. Upgrade to open a session and have the desk review your trades.`}
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/app/subscription"
            className="rounded-full bg-brand px-5 py-2.5 text-[14px] font-semibold text-black transition-opacity hover:opacity-90 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            Upgrade access
          </Link>
          <Link
            href="/app"
            className="rounded-full border border-white/[0.14] px-5 py-2.5 text-[14px] text-white/70 transition-colors hover:bg-raised hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
