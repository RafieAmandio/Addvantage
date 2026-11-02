import Link from "next/link";
import { AnimatedFigure } from "@/components/ui/AnimatedNumber";
import type { TradingPlan } from "@/features/plan/types";

function age(date: string) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (Number.isNaN(days)) return null;
  return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
}

/** Celsis-style yellow hero card for the active trading plan. */
export function PlanCard({ plan, paid }: { plan: TradingPlan | null; paid: boolean }) {
  const top = plan?.setups[0];
  const published = plan ? age(plan.date) : null;

  return (
    <section aria-label="Active trading plan" className="flex min-w-0 flex-1 flex-col rounded-2xl bg-brand p-5 text-black sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-black/60">
          Active plan{plan ? <span className="px-1.5 text-black/30">/</span> : null}
          {plan?.horizon}
        </p>
        {published && <span className="text-[12px] text-black/55">{published}</span>}
      </div>

      {!plan ? (
        <div className="flex flex-1 flex-col justify-center py-6">
          <p className="font-num text-[30px] font-semibold leading-8">No plan published</p>
          <p className="mt-1 text-[14px] text-black/65">The desk hasn&apos;t posted a plan yet.</p>
        </div>
      ) : !paid || !top ? (
        <div className="flex flex-1 flex-col justify-center py-6">
          <p className="font-num text-[30px] font-semibold leading-8">{plan.setups.length} setups live</p>
          <p className="mt-1 text-[14px] text-black/65">Entries, stops and the thesis are for VIP+.</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col py-4">
          <div className="flex items-baseline gap-2">
            <span className="font-num text-[44px] font-semibold leading-[44px] tracking-[-0.01em]">{top.instrument}</span>
            <span className="rounded-full bg-black px-2.5 py-0.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-brand">
              {top.direction}
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-[13px]">
            {[
              ["Entry", top.entry],
              ["Stop", top.stop],
              ["Target", top.targets[0] ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-black/55">{k}</dt>
                <dd className="truncate font-num text-[20px] font-semibold leading-6"><AnimatedFigure text={v} fromRatio={0.98} /></dd>
              </div>
            ))}
          </dl>
          {plan.setups.length > 1 && <p className="mt-3 text-[13px] text-black/60">+{plan.setups.length - 1} more setups in this plan</p>}
        </div>
      )}

      <div className="mt-auto flex gap-2">
        <Link
          href={plan ? `/app/plan/${plan.id}` : "/app/plan"}
          className="lift flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-black text-[14px] font-semibold text-white transition-colors hover:bg-black-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
        >
          {plan && !paid ? "Unlock plan" : "Open plan"}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M3 9l6-6M4.5 3H9v4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <Link
          href="/app/plan/archive"
          className="lift flex h-11 items-center rounded-full border border-black/20 px-4 text-[14px] font-semibold transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
        >
          Archive
        </Link>
      </div>
    </section>
  );
}
