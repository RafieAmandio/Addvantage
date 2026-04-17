import Link from "next/link";
import { cn } from "@/lib/cn";

interface Props {
  planIds: string[] | null | undefined;
  className?: string;
}

/**
 * Small chip strip linking a news item to any trading plans it's cross-linked
 * to via `news_items.related_plan_ids`. Renders nothing if there are no links.
 * Server-safe (no client hooks).
 */
export function RelatedPlansChips({ planIds, className }: Props) {
  const ids = (planIds ?? []).filter((id) => id && id.length > 0);
  if (ids.length === 0) return null;

  return (
    <div className={cn("", className)}>
      <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
        Related plans · {ids.length}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {ids.map((id) => (
          <Link
            key={id}
            href={`/app/plan/${id}`}
            className="border border-lime/40 px-3 py-1 font-mono text-[10px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
          >
            {id}
          </Link>
        ))}
      </div>
    </div>
  );
}
