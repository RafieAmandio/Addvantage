import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  getPlanById,
  listPublishedPlans,
} from "@/features/plan/queries/plans";
import { dbPlanToTradingPlan } from "@/features/plan/lib/adapt";
import { PlanDetail } from "@/features/plan/components/PlanDetail";
import { PlanSiblingKeys } from "@/features/plan/components/PlanSiblingKeys";
import { NewsMentioningPlan } from "@/features/plan/components/NewsMentioningPlan";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export default async function PlanDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [row, allRows] = await Promise.all([
    getPlanById(params.id),
    listPublishedPlans({ limit: 100 }),
  ]);

  if (!row || row.status !== "published") return notFound();

  const plan = dbPlanToTradingPlan(row);
  const all = allRows.map(dbPlanToTradingPlan);

  const latestId = all[0]?.id ?? plan.id;
  const isLatest = plan.id === latestId;
  const idx = all.findIndex((p) => p.id === plan.id);
  const newer = idx > 0 ? all[idx - 1] : null;
  const older = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
  const firstId = all[0]?.id ?? plan.id;
  const lastId = all[all.length - 1]?.id ?? plan.id;

  const btn =
    "rounded-full border border-white/[0.14] px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand";

  return (
    <div className="space-y-4 px-4 pb-10 sm:px-6">
      <PlanSiblingKeys
        newerId={newer?.id ?? null}
        olderId={older?.id ?? null}
        firstId={firstId}
        lastId={lastId}
      />
      <PlanDetail
        plan={plan}
        isLatest={isLatest}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: "Home", href: "/app" },
              { label: "Plan", href: "/app/plan" },
              { label: "Archive", href: "/app/plan/archive" },
              { label: plan.id },
            ]}
          />
        }
        headerExtra={
          <>
            <Link href={`/app/plan/compare?a=${plan.id}`} title="Compare this plan with another" className={btn}>
              Compare
            </Link>
            <Link href="/app/plan/archive" className={btn}>
              Archive
            </Link>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <NewsMentioningPlan planId={plan.id} />
        </div>
        <nav className="grid grid-cols-2 gap-4 lg:col-start-2" aria-label="Neighbouring plans">
          <SiblingLink href={newer ? `/app/plan/${newer.id}` : null} label="Newer plan" text={newer ? `${newer.id} · ${newer.date}` : "Already newest"} />
          <SiblingLink href={older ? `/app/plan/${older.id}` : null} label="Older plan" text={older ? `${older.id} · ${older.date}` : "Archive bottom"} right />
        </nav>
      </div>
    </div>
  );
}

function SiblingLink({ href, label, text, right }: { href: string | null; label: string; text: string; right?: boolean }) {
  return (
    <Link
      href={href ?? "/app/plan/archive"}
      aria-disabled={!href}
      className={cn(
        "block rounded-2xl bg-panel p-4 transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
        right && "text-right",
        !href && "pointer-events-none opacity-40",
      )}
    >
      <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
        {right ? `${label} →` : `← ${label}`}
      </span>
      <span className="mt-1 block truncate text-[14px] text-white">{text}</span>
    </Link>
  );
}
