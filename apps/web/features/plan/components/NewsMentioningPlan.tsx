import Link from "next/link";
import { formatDate, formatWibTime } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { getNewsForPlan } from "@/features/plan/queries/news";

interface Props {
  planId: string;
  className?: string;
}

export async function NewsMentioningPlan({ planId, className }: Props) {
  const rows = await getNewsForPlan(planId);
  if (rows.length === 0) return null;

  return (
    <Panel title={`News mentioning this plan · ${rows.length}`} className={className}>
      <ul className="-my-2.5 divide-y divide-white/[0.07]">
        {rows.map((n) => {
          const ts = n.publishedAt ?? n.fetchedAt;
          return (
            <li key={n.id}>
              <Link
                href={`/app/news/${n.id}`}
                className="group block py-2.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
              >
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
                  {n.sourceCode}
                  <span className="px-1.5 text-white/20">/</span>
                  {formatDate(ts)} {formatWibTime(ts)} WIB
                </p>
                <p className="mt-0.5 text-[15px] leading-[22px] text-white/90 transition-colors group-hover:text-white">
                  {n.headline}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
