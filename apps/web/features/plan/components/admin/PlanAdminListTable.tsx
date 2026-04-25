import Link from "next/link";
import type { Plan, PlanStatus } from "@/features/plan/types";

const STATUS_CHIP: Record<PlanStatus, string> = {
  draft: "bg-gray-2 border-gray-3 text-paper/60",
  published: "bg-lime/10 border-lime text-lime",
  closed: "bg-blood/10 border-blood text-blood",
};

function fmt(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toISOString().slice(0, 16).replace("T", " ");
}

export function PlanAdminListTable({ plans }: { plans: Plan[] }) {
  if (plans.length === 0) {
    return (
      <div className="border border-gray-3 bg-gray-2/40 p-12 text-center font-mono text-[10px] uppercase tracking-widest2 text-paper/50">
        ● NO PLANS · click “New plan” to author the first
      </div>
    );
  }

  return (
    <div className="space-y-px bg-gray-3">
      {plans.map((p) => (
        <Link
          key={p.id}
          href={`/admin/plans/${p.id}`}
          className="group grid grid-cols-12 items-center gap-6 bg-ink p-5 transition-colors hover:bg-gray-2"
        >
          <div className="col-span-12 lg:col-span-2">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
              {p.symbol}
            </div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
              {fmt(p.updated_at)}
            </div>
            <div className="mt-2 flex gap-2 font-mono text-[9px] uppercase tracking-widest2">
              <span className="text-paper/70">{p.direction}</span>
              <span className="text-paper/50">·</span>
              <span className="text-paper/70">{p.tier}</span>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <div className="font-display text-xl text-paper transition-colors group-hover:text-brand">
              {p.thesis || "(no thesis)"}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-widest2 text-paper/60">
              {p.entry !== null && <span>E {p.entry}</span>}
              {p.stop !== null && <span>S {p.stop}</span>}
              {p.target !== null && <span>T {p.target}</span>}
              {p.r_multiple !== null && <span>R {p.r_multiple}</span>}
              {p.tags.map((t) => (
                <span
                  key={t}
                  className="border border-lime/40 px-1.5 py-0.5 text-lime"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
          <div className="col-span-12 flex justify-end lg:col-span-2">
            <span
              className={`border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2 ${STATUS_CHIP[p.status]}`}
            >
              {p.status}
              {p.status === "closed" && p.outcome ? ` · ${p.outcome}` : ""}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
