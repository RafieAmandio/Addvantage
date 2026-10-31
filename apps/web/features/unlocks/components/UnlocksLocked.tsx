import { Panel } from "@/components/ui/Panel";
import { PaywallOverlay } from "@/components/ui/Paywall";
import { UnlocksShell } from "@/features/unlocks/components/UnlocksView";

const GHOST_ROWS = [3, 4, 34];

export function UnlocksLocked() {
  return (
    <UnlocksShell>
      <Panel title="Upcoming unlocks" className="relative min-h-[460px] overflow-hidden">
        <ul className="pointer-events-none divide-y divide-white/[0.07]" aria-hidden="true">
          {GHOST_ROWS.map((d) => (
            <li key={d} className="flex items-center gap-4 py-3.5">
              <div className="h-10 w-11 rounded bg-white/[0.06]" />
              <div className="flex-1">
                <div className="h-4 w-40 rounded bg-white/[0.08]" />
                <div className="mt-2 h-3 w-24 rounded bg-white/[0.04]" />
              </div>
              <div className="h-6 w-14 rounded bg-white/[0.06]" />
            </li>
          ))}
        </ul>
        <div className="absolute inset-0">
          <PaywallOverlay
            surface="Token Unlocks"
            reason="The supply-shock radar (top-200 unlock events above 4.9% of circulating supply) is restricted to VIP+ Trader. Upgrade to see what's unlocking before it hits the tape."
          />
        </div>
      </Panel>
    </UnlocksShell>
  );
}
