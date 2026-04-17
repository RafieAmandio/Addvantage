import Link from "next/link";
import { SectionNumber, ImpactPill } from "@/components/ui/Marker";
import { formatTime } from "@/lib/cn";
import type { NewsItem } from "@/lib/mock/types";

/**
 * "Informed by" rail on the plan detail page — news items that directly cite
 * this plan via `relatedPlanIds`. Distinct from `NewsMentioningPlan` which is
 * rendered by the route, not by `PlanDetail`.
 */
export function PlanDetailInformingNews({
  news,
  sectionNumber,
}: {
  news: NewsItem[];
  sectionNumber: string;
}) {
  return (
    <section className="mt-12">
      <SectionNumber
        n={sectionNumber}
        label={`INFORMED BY · ${news.length} NEWS ITEM${news.length === 1 ? "" : "S"}`}
      />
      <p className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
        News the desk flagged as directly shaping this plan&apos;s thesis.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-px bg-ink-3 md:grid-cols-2">
        {news.map((n) => (
          <Link
            key={n.id}
            href={`/app/news/${n.id}`}
            className="group block bg-ink p-5 transition-colors hover:bg-ink-2"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                {n.id}
              </span>
              <ImpactPill level={n.impact} />
              <span className="ml-auto font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                {formatTime(n.ts)}Z · BY {n.author.toUpperCase()}
              </span>
            </div>
            <h3 className="mt-3 font-display text-xl leading-snug text-paper transition-colors group-hover:text-lime">
              {n.headline}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm text-paper/60">
              {n.analysis}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
