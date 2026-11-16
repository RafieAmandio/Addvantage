import { Panel } from "@/components/ui/Panel";
import { PaywallOverlay } from "@/components/ui/Paywall";
import { EducationTabs } from "@/features/videos/components/EducationTabs";

const GHOST_ROWS = [1, 2, 3];

export function ReportsLocked() {
  return (
    <div className="space-y-4 px-4 pb-10 sm:px-6">
      <EducationTabs current="reports" />
      <Panel title="Class reports" sub="Written recaps of every live class, as PDFs" className="relative min-h-[460px] overflow-hidden">
        <div className="pointer-events-none divide-y divide-white/[0.07]" aria-hidden="true">
          {GHOST_ROWS.map((n) => (
            <div key={n} className="flex items-center gap-4 py-4">
              <div className="h-12 w-16 shrink-0 rounded-lg bg-white/[0.04] sm:w-20" />
              <div className="flex-1">
                <div className="h-3 w-24 rounded bg-white/[0.06]" />
                <div className="mt-2 h-4 w-2/3 max-w-xs rounded bg-white/[0.08]" />
              </div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0">
          <PaywallOverlay
            surface="Class Reports"
            reason="Written recaps of every live class are restricted to VIP+ Trader. Upgrade to read the full report archive."
          />
        </div>
      </Panel>
    </div>
  );
}
