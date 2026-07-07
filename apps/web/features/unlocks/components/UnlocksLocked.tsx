import { PaywallOverlay } from "@/components/ui/Paywall";
import { UnlocksHeader } from "@/features/unlocks/components/UnlocksView";

const GHOST_ROWS = ["IN 3D", "IN 4D", "IN 34D"];

export function UnlocksLocked() {
  return (
    <div className="min-h-screen">
      <UnlocksHeader count={null} />
      <div className="relative min-h-[420px]">
        <div className="pointer-events-none" aria-hidden="true">
          {GHOST_ROWS.map((label) => (
            <div
              key={label}
              className="grid grid-cols-[90px_1fr_120px_90px] items-center gap-6 border-b border-white/[0.06] px-6 py-5"
            >
              <div className="font-mono text-[11px] font-bold uppercase tracking-widest2 text-brand/40">
                {label}
              </div>
              <div>
                <div className="h-4 w-40 bg-white/[0.08]" />
                <div className="mt-2 h-3 w-24 bg-white/[0.04]" />
              </div>
              <div className="h-4 w-full bg-white/[0.06]" />
              <div className="h-4 w-full bg-white/[0.04]" />
            </div>
          ))}
        </div>
        <PaywallOverlay
          surface="Token Unlocks"
          reason="The supply-shock radar (top-200 unlock events above 4.9% of circulating supply) is restricted to VIP+ Trader. Upgrade to see what's unlocking before it hits the tape."
        />
      </div>
    </div>
  );
}
