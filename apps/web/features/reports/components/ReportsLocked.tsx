import { PaywallOverlay } from "@/components/ui/Paywall";
import { ReportsHeader } from "@/features/reports/components/ReportsView";

const GHOST_ROWS = ["REPORT 01", "REPORT 02", "REPORT 03"];

export function ReportsLocked() {
  return (
    <div className="stagger">
      <ReportsHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="relative min-h-[420px]">
          <div className="pointer-events-none border-t border-gray-3" aria-hidden="true">
            {GHOST_ROWS.map((label) => (
              <div
                key={label}
                className="grid grid-cols-[110px_1fr_136px] items-center gap-6 border-b border-gray-3 bg-black px-6 py-5"
              >
                <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand/40">
                  {label}
                </div>
                <div>
                  <div className="h-4 w-2/3 max-w-xs bg-white/[0.08]" />
                  <div className="mt-2 h-3 w-1/3 max-w-[180px] bg-white/[0.04]" />
                </div>
                <div className="hidden aspect-[4/3] border border-white/[0.06] bg-white/[0.03] sm:block" />
              </div>
            ))}
          </div>
          <PaywallOverlay
            surface="Class Reports"
            reason="Written class recaps and market-session reports are restricted to VIP+ Trader. Upgrade to unlock the full report archive."
          />
        </div>
      </div>
    </div>
  );
}
