import { PaywallOverlay } from "@/components/ui/Paywall";
import { VideoModulesHeader } from "@/features/videos/components/RecordingsView";

const GHOST_ROWS = ["MODULE 01", "MODULE 02", "MODULE 03"];

export function VideoModulesLocked() {
  return (
    <div className="stagger">
      <VideoModulesHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="relative min-h-[420px]">
          <div className="pointer-events-none border-t border-gray-3" aria-hidden="true">
            {GHOST_ROWS.map((label) => (
              <div
                key={label}
                className="grid grid-cols-[110px_1fr_176px] items-center gap-6 border-b border-gray-3 bg-black px-6 py-5"
              >
                <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand/40">
                  {label}
                </div>
                <div>
                  <div className="h-4 w-2/3 max-w-xs bg-white/[0.08]" />
                  <div className="mt-2 h-3 w-1/3 max-w-[180px] bg-white/[0.04]" />
                </div>
                <div className="hidden aspect-video border border-white/[0.06] bg-white/[0.03] sm:block" />
              </div>
            ))}
          </div>
          <PaywallOverlay
            surface="Video Modules"
            reason="Recorded market analysis and live session replays are restricted to VIP+ Trader. Upgrade to unlock the full module archive."
          />
        </div>
      </div>
    </div>
  );
}
