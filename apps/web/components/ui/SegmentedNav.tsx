import Link from "next/link";
import { cn } from "@/lib/cn";

export function SegmentedNav<T extends string>({
  items,
  current,
  hrefFor,
  className,
  labelFor,
  ariaLabel,
}: {
  items: readonly T[];
  current: T;
  hrefFor: (item: T) => string;
  className?: string;
  labelFor?: (item: T) => string;
  ariaLabel?: string;
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "flex gap-2 font-mono text-[10px] uppercase tracking-widest2",
        className,
      )}
    >
      {items.map((item) => (
        <Link
          key={item}
          href={hrefFor(item)}
          aria-current={item === current ? "page" : undefined}
          className={cn(
            "border px-2 py-1 transition-colors focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
            item === current
              ? "border-brand bg-brand text-black"
              : "border-gray-3 text-white/60 hover:border-brand hover:text-brand",
          )}
        >
          {labelFor ? labelFor(item) : item}
        </Link>
      ))}
    </nav>
  );
}
