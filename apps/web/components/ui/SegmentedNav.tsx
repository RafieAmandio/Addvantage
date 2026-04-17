import Link from "next/link";
import { cn } from "@/lib/cn";

export function SegmentedNav<T extends string>({
  items,
  current,
  hrefFor,
  className,
  labelFor,
}: {
  items: readonly T[];
  current: T;
  hrefFor: (item: T) => string;
  className?: string;
  labelFor?: (item: T) => string;
}) {
  return (
    <nav
      className={cn(
        "flex gap-2 font-mono text-[10px] uppercase tracking-widest2",
        className,
      )}
    >
      {items.map((item) => (
        <Link
          key={item}
          href={hrefFor(item)}
          className={cn(
            "border px-2 py-1 transition-colors",
            item === current
              ? "border-lime bg-lime text-ink"
              : "border-ink-3 text-paper/60 hover:border-lime hover:text-lime",
          )}
        >
          {labelFor ? labelFor(item) : item}
        </Link>
      ))}
    </nav>
  );
}
