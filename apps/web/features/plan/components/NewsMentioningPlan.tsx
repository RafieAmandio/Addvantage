import Link from "next/link";
import { cn, formatDate, formatTime } from "@/lib/cn";
import { getNewsForPlan } from "@/features/plan/queries/news";

interface Props {
  planId: string;
  className?: string;
}

export async function NewsMentioningPlan({ planId, className }: Props) {
  const rows = await getNewsForPlan(planId);
  if (rows.length === 0) return null;

  return (
    <section className={cn("mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-12", className)}>
      <div className="border border-gray-3 bg-gray-2/30">
        <header className="border-b border-gray-3 px-4 py-3">
          <h2 className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
            News mentioning this plan · {rows.length}
          </h2>
        </header>
        <ul className="divide-y divide-gray-3">
          {rows.map((n) => {
            const ts = n.publishedAt ?? n.fetchedAt;
            return (
              <li key={n.id}>
                <Link
                  href={`/app/news/${n.id}`}
                  className="group block px-4 py-3 transition-colors hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                >
                  <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                    <span className="text-brand">[{n.sourceCode}]</span>
                    <span>
                      · {formatDate(ts)} · {formatTime(ts)}Z
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-white transition-colors group-hover:text-brand">
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
