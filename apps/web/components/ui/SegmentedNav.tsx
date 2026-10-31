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
        "flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-medium",
        className,
      )}
    >
      {items.map((item) => (
        <Link
          key={item}
          href={hrefFor(item)}
          aria-current={item === current ? "page" : undefined}
          className={cn(
            "transition-colors focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
            item === current ? "text-white" : "text-white/30 hover:text-white/60",
          )}
        >
          {labelFor ? labelFor(item) : item}
        </Link>
      ))}
    </nav>
  );
}
