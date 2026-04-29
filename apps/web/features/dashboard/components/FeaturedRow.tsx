import Link from "next/link";
import { DataLabel, ImpactPill, BiasBadge } from "@/components/ui/Marker";
import { SectionHeader } from "@/features/dashboard/components/SectionHeader";
import { formatTime, cn } from "@/lib/cn";
import type { NewsListItem } from "@/features/news/queries/news";
import type { TradingPlan } from "@/features/plan/types";

export function FeaturedRow({
  topNews,
  seenNewsIds,
  seenHydrated,
  plan,
  paid,
  className,
}: {
  topNews: NewsListItem[];
  seenNewsIds: string[];
  seenHydrated: boolean;
  plan: TradingPlan | null;
  paid: boolean;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-white/[0.06]", className)}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid grid-cols-12 gap-4 sm:gap-6">
          <div className="col-span-12 lg:col-span-8">
            <SectionHeader
              n="01"
              label="Latest news"
              right={`${topNews.length} items`}
            >
              <Link
                href="/app/news"
                className="text-xs font-medium text-brand hover:underline focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
              >
                View all
              </Link>
            </SectionHeader>
            {topNews.length === 0 ? (
              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                <p className="text-sm text-white/40">No approved news items yet.</p>
                <p className="mt-1 text-xs text-white/25">
                  Items will appear here once approved.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {topNews.map((n) => {
                  const seen = seenHydrated && seenNewsIds.includes(n.id);
                  const ts = n.published_at ?? n.fetched_at;
                  return (
                    <Link
                      key={n.id}
                      href={`/app/news/${n.id}`}
                      className={cn(
                        "group block rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-white/[0.1] hover:bg-white/[0.04] focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
                        seen && "opacity-60 hover:opacity-100"
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-brand">
                          {n.source_code}
                        </span>
                        <ImpactPill level={n.impact} />
                        <BiasBadge bias={n.bias} />
                        {seen && (
                          <span className="text-[10px] text-white/30">
                            read
                          </span>
                        )}
                        <span className="ml-auto hidden text-xs text-white/30 sm:inline">
                          {formatTime(ts)}
                        </span>
                      </div>
                      <h3
                        className={cn(
                          "mt-2 text-lg font-medium leading-snug transition-colors group-hover:text-brand",
                          seen ? "text-white/70" : "text-white"
                        )}
                      >
                        {n.headline}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-sm text-white/45">
                        {n.analysis}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="col-span-12 lg:col-span-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
              <div className="flex items-center justify-between">
                <DataLabel>Trading Plan</DataLabel>
                {paid ? (
                  <span className="text-[11px] text-moss">Unlocked</span>
                ) : (
                  <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/30">PRO</span>
                )}
              </div>
              {plan ? (
                <>
                  <h3 className="mt-3 text-lg font-medium text-white">
                    {paid
                      ? plan.thesis.length > 100
                        ? plan.thesis.slice(0, 100) + "..."
                        : plan.thesis
                      : "Macro is repricing the cut path. Four setups live."}
                  </h3>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {plan.setups.map((s) => (
                      <div key={s.id} className="rounded-lg bg-white/[0.04] p-2.5 text-center">
                        <div className="text-xs text-white/40">
                          {s.instrument}
                        </div>
                        <div
                          className={cn(
                            "mt-0.5 text-sm font-bold",
                            s.direction === "long" ? "text-moss" : "text-brand"
                          )}
                        >
                          {s.direction === "long" ? "Long" : "Short"}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="mt-3 py-6 text-center">
                  <p className="text-sm text-white/40">No active plan</p>
                  <p className="mt-1 text-xs text-white/25">
                    The desk hasn&apos;t published a trading plan yet.
                  </p>
                </div>
              )}
              <Link
                href="/app/plan"
                className="mt-4 block rounded-lg bg-brand py-2.5 text-center text-sm font-bold text-black transition-colors hover:bg-brand-dim focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
              >
                {paid ? "Open plan" : "Unlock plan"}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
