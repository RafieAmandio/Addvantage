import { SegmentedNav } from "@/components/ui/SegmentedNav";

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
    <SegmentedNav
      items={symbols}
      current={current}
      hrefFor={hrefFor}
      className={className}
    />
  );
}
