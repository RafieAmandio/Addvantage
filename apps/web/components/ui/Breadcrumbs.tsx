import Link from "next/link";

/**
 * Inline breadcrumb trail used on detail pages. The last crumb is
 * rendered as plain text (current location), earlier ones as links.
 *
 * Styling: terminal-style mono text with amber separators, fits above
 * the hero block of a page so the user can retrace their path.
 */
export function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest2 text-paper/40"
    >
      {items.map((it, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${it.label}-${i}`} className="flex items-center gap-1.5">
            {it.href && !isLast ? (
              <Link
                href={it.href}
                className="text-paper/60 transition-colors hover:text-amber"
              >
                {it.label}
              </Link>
            ) : (
              <span className={isLast ? "text-amber" : "text-paper/60"}>
                {it.label}
              </span>
            )}
            {!isLast && <span className="text-amber/40">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
