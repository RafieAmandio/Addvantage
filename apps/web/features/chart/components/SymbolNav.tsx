import Link from "next/link";
import { cn } from "@/lib/cn";

export function SymbolNav({
  symbols,
  current,
  hrefFor = (s) => `/app/chart/${s}`,
  className,
}: {
  symbols: readonly string[];
  current: string;
  hrefFor?: (symbol: string) => string;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "flex gap-2 font-mono text-[10px] uppercase tracking-widest2",
        className,
      )}
    >
      {symbols.map((s) => (
        <Link
          key={s}
          href={hrefFor(s)}
          className={cn(
            "border px-2 py-1 transition-colors",
            s === current
              ? "border-lime bg-lime text-ink"
              : "border-ink-3 text-paper/60 hover:border-lime hover:text-lime",
          )}
        >
          {s}
        </Link>
      ))}
    </nav>
  );
}
