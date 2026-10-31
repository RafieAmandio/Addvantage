import Link from "next/link";

interface Props {
  planIds: string[] | null | undefined;
  className?: string;
}

// ponytail: shows the plan id only; join plan symbol/date server-side if ids prove unreadable.
export function RelatedPlansChips({ planIds, className }: Props) {
  const ids = (planIds ?? []).filter((id) => id && id.length > 0);
  if (ids.length === 0) return null;

  return (
    <ul className={className ?? "-my-1 divide-y divide-white/[0.07]"}>
      {ids.map((id) => (
        <li key={id}>
          <Link
            href={`/app/plan/${id}`}
            className="flex items-center justify-between py-2 text-[14px] text-white/85 hover:text-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            {id}
            <span className="text-white/30">→</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
