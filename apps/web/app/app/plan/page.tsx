"use client";

import Link from "next/link";
import { getLatestPlan } from "@/lib/mock/plans";
import { PlanDetail } from "@/components/ui/PlanDetail";

export default function PlanPage() {
  const plan = getLatestPlan();

  return (
    <PlanDetail
      plan={plan}
      isLatest
      headerExtra={
        <Link
          href="/app/plan/archive"
          className="border border-ink-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/60 hover:border-lime hover:text-lime"
        >
          View archive →
        </Link>
      }
    />
  );
}
