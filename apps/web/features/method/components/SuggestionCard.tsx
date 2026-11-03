import type { Level } from "@tradevantage/shared";
import { cn } from "@/lib/cn";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import { VERDICT, levelName } from "../lib/explain";
import type { Rule } from "../lib/checklist";
import type { Suggestion } from "../lib/suggest";

const CHIP = { order: "bg-brand text-black", watch: "bg-white/[0.1] text-white", pass: "bg-white/[0.06] text-white/55" } as const;

/** One read of a level: what to do, the plan, why, and the full rules behind it on demand. */
export function SuggestionCard({ level, s, rules, action }: { level: Level; s: Suggestion; rules: Rule[]; /** Top-right control, e.g. Close. */ action?: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={cn("rounded-full px-2 py-0.5 text-[12px] font-semibold", CHIP[s.verdict])}>{VERDICT[s.verdict].label}</span>
        <span className="text-[13px] text-white/45">
          <span className={level.side === "buy" ? "text-up" : "text-down"}>{level.side === "buy" ? "Buy" : "Sell"}</span> {levelName(level)} <span className="font-num">{fmtPrice(level.price)}</span>
          {level.status === "at-level" && level.type === "inverse" && <span className="text-brand"> · at the level now</span>}
        </span>
        {action && <span className="ml-auto">{action}</span>}
      </div>

      <div>
        <p className="text-[20px] font-semibold leading-7 text-white">
          <span className="text-white/45">Suggestion: </span>
          <span className={s.verdict === "order" ? (level.side === "buy" ? "text-up" : "text-down") : ""}>{s.head}</span>
        </p>
        {s.note && <p className="mt-0.5 text-[14px] leading-[21px] text-white/70">{s.note}</p>}
        {s.plan.length > 0 && (
          <p className="mt-1 flex flex-wrap gap-x-4 text-[14px]">
            {s.plan.map((x) => (
              <span key={x.label}>
                {x.label !== "R" && <span className="text-white/45">{x.label} </span>}
                <span className="font-num font-semibold text-white">{x.value}</span>
              </span>
            ))}
          </p>
        )}
      </div>

      {s.why.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">Why</p>
          <ul className="mt-1 space-y-0.5 text-[14px] leading-[21px]">
            {s.why.map((w) => (
              <li key={w.text} className="flex gap-2">
                <span className={cn("w-3 shrink-0", w.ok ? "text-up" : "text-down")} aria-hidden>
                  {w.ok ? "✓" : "✕"}
                </span>
                <span className={w.ok ? "text-white/80" : "text-white"}>{w.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="group">
        <summary className="cursor-pointer list-none text-[13px] text-white/55 hover:text-white [&::-webkit-details-marker]:hidden">
          <span className="mr-1 inline-block transition-transform group-open:rotate-90" aria-hidden>
            ›
          </span>
          All rules · {s.met} of {s.total}
        </summary>
        <Checklist rules={rules} bare />
      </details>

      <p className="text-[12px] text-white/35">Suggestion from the level rules, not financial advice.</p>
    </div>
  );
}

export function RuleCount({ rules }: { rules: Rule[] }) {
  const met = rules.filter((r) => r.met).length;
  return <span className={met === rules.length ? "text-brand" : "text-white/55"}>{met === rules.length ? "Every rule holds" : `${met} of ${rules.length} rules`}</span>;
}

export function Checklist({ rules, bare = false }: { rules: Rule[]; /** No heading, for use inside the collapsed "All rules". */ bare?: boolean }) {
  return (
    <div className={cn(bare ? "mt-1" : "mt-4", "motion-safe:animate-[rise_250ms_ease-out]")}>
      {!bare && (
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
          Rules · <RuleCount rules={rules} />
        </p>
      )}
      <ul className="mt-1 grid gap-x-6 sm:grid-cols-2">
        {rules.map((r) => (
          <li key={r.rule} className="flex gap-2 border-b border-white/[0.07] py-2 text-[13px]">
            <span className={cn("w-4 shrink-0 font-semibold", r.met ? "text-up" : "text-down")} aria-label={r.met ? "met" : "not met"}>
              {r.met ? "✓" : "✕"}
            </span>
            <span className="min-w-0">
              <span className="block text-white">{r.rule}</span>
              <span className="block text-white/45">{r.evidence}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
