import { formatDate } from "@/lib/cn";
import type { TradingPlan } from "@/features/plan/types";

export function PlanComparePicker({
  label,
  value,
  onChange,
  plans,
  latest,
  excludeId,
}: {
  label: string;
  value: string | null;
  onChange: (id: string | null) => void;
  plans: TradingPlan[];
  latest: TradingPlan;
  excludeId: string | null;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="mt-1 w-full rounded-full border border-white/[0.14] bg-raised px-4 py-2 text-[14px] text-white outline-none transition-colors focus-visible:border-brand"
      >
        <option value="">Pick a plan</option>
        {plans.map((p) => {
          const isLatest = p.id === latest.id;
          const disabled = p.id === excludeId;
          return (
            <option key={p.id} value={p.id} disabled={disabled}>
              {p.id} · {formatDate(p.date)} · {p.horizon}
              {isLatest ? " · latest" : ""}
              {disabled ? " · in other slot" : ""}
            </option>
          );
        })}
      </select>
    </label>
  );
}

export function PlanCompareSwapButton({
  a,
  b,
  onSwap,
}: {
  a: string | null;
  b: string | null;
  onSwap: () => void;
}) {
  return (
    <div className="flex justify-center">
      <button
        onClick={onSwap}
        disabled={!a || !b}
        title="Swap A and B"
        aria-label="Swap plans"
        className="rounded-full border border-white/[0.14] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-raised disabled:cursor-default disabled:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
      >
        ⇄ Swap
      </button>
    </div>
  );
}
