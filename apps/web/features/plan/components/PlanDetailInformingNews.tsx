import Link from "next/link";
import { SectionNumber, ImpactPill } from "@/components/ui/Marker";
import { formatTime } from "@/lib/cn";
import type { NewsItem } from "@/lib/mock/types";

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
      <p className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
        News the desk flagged as directly shaping this plan&apos;s thesis.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-px bg-gray-3 md:grid-cols-2">
        {news.map((n) => (
          <Link
            key={n.id}
            href={`/app/news/${n.id}`}
            className="group block bg-black p-5 transition-colors hover:bg-gray-2"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                {n.id}
              </span>
              <ImpactPill level={n.impact} />
              <span className="ml-auto font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                {formatTime(n.ts)}Z · BY {n.author.toUpperCase()}
              </span>
            </div>
            <h3 className="mt-3 font-display text-xl leading-snug text-white transition-colors group-hover:text-brand">
              {n.headline}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm text-white/60">
              {n.analysis}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
