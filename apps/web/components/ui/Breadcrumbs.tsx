import Link from "next/link";

export function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest2 text-white/40"
    >
      {items.map((it, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${it.label}-${i}`} className="flex items-center gap-1.5">
            {it.href && !isLast ? (
              <Link
                href={it.href}
                className="text-white/60 transition-colors hover:text-brand"
              >
                {it.label}
              </Link>
            ) : (
              <span className={isLast ? "text-brand" : "text-white/60"}>
                {it.label}
              </span>
            )}
            {!isLast && <span className="text-brand/40">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
