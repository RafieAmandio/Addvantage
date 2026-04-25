import Link from "next/link";
import { DataLabel, ImpactPill, BiasBadge } from "@/components/ui/Marker";
import { CalendarPeekRow } from "@/features/calendar/components/CalendarPeekRow";
import { SectionHeader } from "@/features/dashboard/components/SectionHeader";
import { formatTime } from "@/lib/cn";
import { cn } from "@/lib/cn";
import type {
  NewsItem,
  CalendarEvent,
  TradingPlan,
} from "@/lib/mock/types";

/**
 * Middle band of the dashboard: top-of-the-wire news on the left, and a
 * right rail with the Trading Plan card + 48h calendar peek.
 */
export function FeaturedRow({
  topNews,
  seenNewsIds,
  seenHydrated,
  plan,
  paid,
  upcoming,
  className,
}: {
  topNews: NewsItem[];
  seenNewsIds: string[];
  seenHydrated: boolean;
  plan: TradingPlan;
  paid: boolean;
  upcoming: CalendarEvent[];
  className?: string;
}) {
  return (
    <section className={cn("border-b border-gray-3", className)}>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-12 gap-6">
          {/* Featured news */}
          <div className="col-span-12 lg:col-span-8">
            <SectionHeader
              n="01 /"
              label="Top of the wire"
              right="3 most-impact items"
            >
              <Link
                href="/app/news"
                className="font-mono text-[10px] uppercase tracking-widest2 text-brand hover:underline"
              >
                Full feed →
              </Link>
            </SectionHeader>
            <div className="mt-4 space-y-px bg-gray-3">
              {topNews.map((n) => {
                const seen = seenHydrated && seenNewsIds.includes(n.id);
                return (
                  <Link
                    key={n.id}
                    href={`/app/news/${n.id}`}
                    className={cn(
                      "group block bg-black p-5 transition-colors hover:bg-gray-2",
                      seen && "opacity-60 hover:opacity-100"
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                        {n.id}
                      </span>
                      <ImpactPill level={n.impact} />
                      <BiasBadge bias={n.bias} />
                      {seen && (
                        <span className="font-mono text-[8px] uppercase tracking-widest2 text-white/40">
                          ✓ SEEN
                        </span>
                      )}
                      <span className="ml-auto font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                        {formatTime(n.ts)}Z · BY {n.author.toUpperCase()}
                      </span>
                    </div>
                    <h3
                      className={cn(
                        "mt-3 font-display text-2xl leading-snug transition-colors group-hover:text-brand",
                        seen ? "text-white/70" : "text-white"
                      )}
                    >
                      {n.headline}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-white/60">
                      {n.analysis}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right rail */}
          <aside className="col-span-12 space-y-8 lg:col-span-4">
            {/* Plan */}
            <div className="border border-brand/40 bg-gray-2/30 p-5 scanline">
              <div className="flex items-center justify-between">
                <DataLabel>Trading Plan · TX-03</DataLabel>
                {paid ? (
                  <span className="font-mono text-[9px] uppercase tracking-widest2 text-moss">
                    ○ UNLOCKED
                  </span>
                ) : (
                  <span className="font-mono text-[9px] uppercase tracking-widest2 text-red-500">
                    ● LOCKED
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-display text-2xl text-white">
                {paid
                  ? plan.thesis.slice(0, 100) + "…"
                  : "Macro is repricing the cut path. Four setups live."}
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                {plan.setups.map((s) => (
                  <div key={s.id} className="border border-gray-3 bg-black p-2">
                    <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                      {s.instrument}
                    </div>
                    <div
                      className={cn(
                        "font-display text-sm",
                        s.direction === "long" ? "text-moss" : "text-brand"
                      )}
                    >
                      {s.direction === "long" ? "LONG" : "SHORT"}
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/app/plan"
                className="mt-4 block border border-brand/60 py-2 text-center font-mono text-[10px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black"
              >
                {paid ? "Open plan →" : "Unlock plan →"}
              </Link>
            </div>

            {/* Calendar peek */}
            <div>
              <SectionHeader n="02 /" label="Calendar · 48h">
                <Link
                  href="/app/calendar"
                  className="font-mono text-[10px] uppercase tracking-widest2 text-brand hover:underline"
                >
                  Full →
                </Link>
              </SectionHeader>
              <div className="mt-4 space-y-px bg-gray-3">
                {upcoming.map((c) => (
                  <CalendarPeekRow key={c.id} event={c} />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
