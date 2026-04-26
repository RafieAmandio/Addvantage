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
    <label className="block">
      <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
        {label}
      </div>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="mt-1 w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-sm text-white outline-none focus:border-brand"
      >
        <option value="">— pick a plan —</option>
        {plans.map((p) => {
          const isLatest = p.id === latest.id;
          const disabled = p.id === excludeId;
          return (
            <option key={p.id} value={p.id} disabled={disabled}>
              {p.id} · {formatDate(p.date)} · {p.horizon}
              {isLatest ? " · LATEST" : ""}
              {disabled ? " · already in other slot" : ""}
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
    <div className="flex justify-center sm:pb-1">
      <button
        onClick={onSwap}
        disabled={!a || !b}
        title="Swap A and B"
        aria-label="Swap plans"
        className="flex items-center gap-2 border border-gray-3 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60 hover:border-brand hover:text-brand disabled:cursor-default disabled:opacity-30"
      >
        <span className="text-base leading-none">⇄</span>
        <span className="sm:hidden">Swap</span>
      </button>
    </div>
  );
}
