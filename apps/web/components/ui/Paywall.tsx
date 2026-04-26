import Link from "next/link";
import { Button } from "./Button";
import { DataLabel } from "./Marker";

export function PaywallOverlay({
  surface,
  reason,
}: {
  surface: string;
  reason?: string;
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/0 via-black/85 to-black" />
      <div className="absolute inset-x-0 top-1/2 z-20 mx-auto max-w-xl -translate-y-1/2 border border-brand bg-gray-2 p-8 shadow-[0_0_60px_rgba(245,158,11,0.15)]">
        <DataLabel>Tier 01 required</DataLabel>
        <div className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-blood-bright">
          ● LOCKED · OPERATOR EYES ONLY
        </div>
        <h3 className="mt-4 font-display text-4xl leading-tight text-white">
          {surface}
        </h3>
        <p className="mt-4 text-sm text-white/70">
          {reason ||
            "This surface is restricted to VIP+ Trader tier. Upgrade to access."}
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/app/subscription" className="focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none">
            <Button size="md">Upgrade access →</Button>
          </Link>
          <Link href="/app" className="focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none">
            <Button variant="outline" size="md">
              ← Return to brief
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
