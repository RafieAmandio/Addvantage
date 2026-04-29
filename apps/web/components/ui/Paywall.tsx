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
      <div className="absolute inset-x-0 top-1/2 z-20 mx-auto max-w-md -translate-y-1/2 rounded-2xl border border-white/[0.08] bg-black-2 p-8 shadow-2xl">
        <p className="text-xs text-white/40">VIP+ required</p>
        <h3 className="mt-3 text-2xl font-bold text-white">
          {surface}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-white/50">
          {reason ||
            `Private consultation with the AI and the desk is restricted to VIP+ Trader. Upgrade to open a session and have the desk review your trades.`}
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/app/subscription"
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-brand-dim focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            Upgrade access
          </Link>
          <Link
            href="/app"
            className="rounded-lg border border-white/[0.1] px-5 py-2.5 text-sm text-white/60 transition-colors hover:border-white/20 hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            Return to brief
          </Link>
        </div>
      </div>
    </div>
  );
}
