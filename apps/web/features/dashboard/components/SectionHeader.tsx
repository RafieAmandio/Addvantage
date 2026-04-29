import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SectionHeader({
  n,
  label,
  right,
  children,
  className,
}: {
  n: string;
  label: string;
  right?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", className)}>
      <div className="flex items-baseline gap-2 text-sm">
        <span className="font-bold text-brand">{n}</span>
        <span className="text-white/20">/</span>
        <span className="text-white/50">{label}</span>
        {right && <span className="text-white/30">{right}</span>}
      </div>
      {children}
    </div>
  );
}
