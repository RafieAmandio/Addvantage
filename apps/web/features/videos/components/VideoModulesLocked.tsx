import { Panel } from "@/components/ui/Panel";
import { PaywallOverlay } from "@/components/ui/Paywall";
import { EducationTabs } from "@/features/videos/components/EducationTabs";

const GHOST_ROWS = [1, 2, 3];

export function VideoModulesLocked() {
  return (
    <div className="space-y-4 px-4 pb-10 sm:px-6">
      <EducationTabs current="videos" />
      <Panel title="Recordings" sub="Market analysis and live session replays from the desk" className="relative min-h-[460px] overflow-hidden">
        <div className="pointer-events-none divide-y divide-white/[0.07]" aria-hidden="true">
          {GHOST_ROWS.map((n) => (
            <div key={n} className="flex items-center gap-4 py-4">
              <div className="hidden aspect-video w-40 shrink-0 rounded-lg bg-white/[0.04] sm:block" />
              <div className="flex-1">
                <div className="h-3 w-24 rounded bg-white/[0.06]" />
                <div className="mt-2 h-4 w-2/3 max-w-xs rounded bg-white/[0.08]" />
              </div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0">
          <PaywallOverlay
            surface="Video Modules"
            reason="Recorded market analysis and live session replays are restricted to VIP+ Trader. Upgrade to unlock the full module archive."
          />
        </div>
      </Panel>
    </div>
  );
}
