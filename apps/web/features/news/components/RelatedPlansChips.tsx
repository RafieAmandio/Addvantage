import Link from "next/link";

interface Props {
  planIds: string[] | null | undefined;
  className?: string;
}

export function RelatedPlansChips({ planIds, className }: Props) {
  const ids = (planIds ?? []).filter((id) => id && id.length > 0);
  if (ids.length === 0) return null;

  return (
    <div className={className}>
      <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
        Related plans · {ids.length}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {ids.map((id) => (
          <Link
            key={id}
            href={`/app/plan/${id}`}
            className="border border-brand/40 px-3 py-1 font-mono text-[10px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black"
          >
            {id}
          </Link>
        ))}
      </div>
    </div>
  );
}
