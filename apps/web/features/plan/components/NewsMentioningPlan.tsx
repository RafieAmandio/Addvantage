import Link from "next/link";
import { cn, formatDate, formatTime } from "@/lib/cn";
import { getNewsForPlan } from "@/features/plan/queries/news";

interface Props {
  planId: string;
  className?: string;
}

/**
 * Server-rendered rail of approved news items whose `related_plan_ids`
 * contain this plan's id. Renders nothing when empty — the column is
 * currently unpopulated; admin tooling to set it is a future tick.
 */
export async function NewsMentioningPlan({ planId, className }: Props) {
  const rows = await getNewsForPlan(planId);
  if (rows.length === 0) return null;

  return (
    <section className={cn("mx-auto max-w-7xl px-6 pb-12", className)}>
      <div className="border border-ink-3 bg-ink-2/30">
        <header className="border-b border-ink-3 px-4 py-3">
          <h2 className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
            News mentioning this plan · {rows.length}
          </h2>
        </header>
        <ul className="divide-y divide-ink-3">
          {rows.map((n) => {
            const ts = n.published_at ?? n.fetched_at;
            return (
              <li key={n.id}>
                <Link
                  href={`/app/news/${n.id}`}
                  className="group block px-4 py-3 transition-colors hover:bg-ink-2"
                >
                  <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                    <span className="text-lime">[{n.source_code}]</span>
                    <span>
                      · {formatDate(ts)} · {formatTime(ts)}Z
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-paper transition-colors group-hover:text-lime">
                    {n.headline}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
