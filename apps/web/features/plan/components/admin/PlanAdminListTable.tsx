import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Plan, PlanStatus } from "@/features/plan/types";
import { flattenText } from "@/components/ui/ProseText";

const STATUS_TEXT: Record<PlanStatus, string> = {
  draft: "text-white/55",
  published: "text-brand",
  closed: "text-down",
};

function fmt(ts: string | null) {
  if (!ts) return "";
  return new Date(ts).toISOString().slice(0, 16).replace("T", " ");
}

export function PlanAdminListTable({ plans }: { plans: Plan[] }) {
  if (plans.length === 0) {
    return <p className="py-10 text-center text-[14px] text-white/40">No plans yet. Use New plan to write the first one.</p>;
  }

  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <thead>
          <tr className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
            <th className="px-5 pb-2 font-semibold">Symbol</th>
            <th className="px-3 pb-2 font-semibold">Thesis</th>
            <th className="px-3 pb-2 font-semibold">Tier</th>
            <th className="px-3 pb-2 font-semibold">Status</th>
            <th className="px-5 pb-2 text-right font-semibold">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.07] border-t border-white/[0.07]">
          {plans.map((p) => {
            const bias = p.bias ?? (p.direction === "long" ? "bullish" : p.direction === "short" ? "bearish" : null);
            return (
              <tr key={p.id} className="group relative transition-colors hover:bg-raised">
                <td className="whitespace-nowrap px-5 py-3 align-top">
                  <Link
                    href={`/admin/plans/${p.id}`}
                    className="font-num text-[18px] font-semibold text-white after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-1 focus-visible:after:ring-brand"
                  >
                    {p.symbol}
                  </Link>
                  <div
                    className={cn(
                      "text-[12px] font-medium capitalize",
                      bias === "bullish" ? "text-up" : bias === "bearish" ? "text-down" : "text-white/55",
                    )}
                  >
                    {p.bias ?? p.direction}
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  <p className="line-clamp-2 text-[14px] leading-[21px] text-white/90">
                    {p.thesis ? flattenText(p.thesis) : <span className="text-white/30">No thesis</span>}
                  </p>
                  {p.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {p.tags.map((t) => (
                        <span key={t} className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] text-white/60">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top text-[13px] uppercase text-white/70">{p.tier}</td>
                <td className={cn("whitespace-nowrap px-3 py-3 align-top text-[13px] font-medium capitalize", STATUS_TEXT[p.status])}>
                  {p.status}
                  {p.status === "closed" && p.outcome ? `, ${p.outcome}` : ""}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-right align-top font-num text-[15px] font-semibold text-white/55">
                  {fmt(p.updatedAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
