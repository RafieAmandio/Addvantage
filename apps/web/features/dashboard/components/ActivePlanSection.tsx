import Link from "next/link";
import { cn } from "@/lib/cn";
import type { TradingPlan } from "@/features/plan/types";

export function ActivePlanSection({
  plan,
  paid,
}: {
  plan: TradingPlan | null;
  paid: boolean;
}) {
  if (!plan) {
    return (
      <section aria-label="Trading plan" className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium text-white/50">Trading Plan</h2>
          </div>
          <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] py-10 text-center">
            <p className="text-sm text-white/50">No active plan published yet.</p>
            <Link
              href="/app/plan"
              className="mt-3 inline-block text-xs text-brand hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              View plan archive
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Trading plan" className="border-b border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h2 className="text-xs font-medium text-white/50">Trading Plan</h2>
            <span className="text-[11px] text-white/30">{plan.id}</span>
            <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-white/50">{plan.horizon}</span>
          </div>
          <Link
            href={`/app/plan/${plan.id}`}
            className="text-xs text-brand hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            Full plan
          </Link>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/60">
          {paid ? plan.thesis : "Upgrade to VIP+ to view the current thesis and setups."}
        </p>

        {paid && plan.setups.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-white/50">
                  <th className="pb-2.5 pr-6 font-medium">Instrument</th>
                  <th className="pb-2.5 pr-6 font-medium">Direction</th>
                  <th className="hidden pb-2.5 pr-6 font-medium sm:table-cell">Entry</th>
                  <th className="hidden pb-2.5 pr-6 font-medium sm:table-cell">Stop</th>
                  <th className="hidden pb-2.5 pr-6 font-medium md:table-cell">Targets</th>
                  <th className="pb-2.5 pr-6 font-medium">Conf.</th>
                  <th className="pb-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {plan.setups.map((s) => {
                  const outcome = s.outcome ?? "live";
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="py-3 pr-6 font-medium text-white">{s.instrument}</td>
                      <td className="py-3 pr-6">
                        <span className={s.direction === "long" ? "text-moss" : "text-brand"}>
                          {s.direction === "long" ? "Long" : "Short"}
                        </span>
                      </td>
                      <td className="hidden py-3 pr-6 text-white/60 sm:table-cell">{s.entry}</td>
                      <td className="hidden py-3 pr-6 text-blood-bright/80 sm:table-cell">{s.stop}</td>
                      <td className="hidden py-3 pr-6 text-white/50 md:table-cell">
                        {s.targets.length > 0 ? s.targets.join(", ") : "—"}
                      </td>
                      <td className="py-3 pr-6">
                        <ConfidenceDots n={s.confidence} />
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            "text-[11px]",
                            outcome === "win" && "text-moss",
                            (outcome === "loss" || outcome === "stopped") && "text-blood-bright",
                            (outcome === "live" || outcome === "open") && "text-white/60",
                            (outcome === "invalidated" || outcome === "skipped") && "text-white/40",
                          )}
                        >
                          {outcome}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!paid && (
          <Link
            href="/app/subscription"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-xs font-bold text-black transition-colors hover:bg-brand-dim focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            Unlock plan
          </Link>
        )}
      </div>
    </section>
  );
}

function ConfidenceDots({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`Confidence ${n} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i < n ? "bg-brand" : "bg-white/10",
          )}
        />
      ))}
    </span>
  );
}
