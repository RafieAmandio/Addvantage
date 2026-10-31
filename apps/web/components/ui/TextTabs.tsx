"use client";

import { cn } from "@/lib/cn";

/** Kalshi-style text-only tabs: the active one is white, the rest fade. */
export function TextTabs<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: readonly { id: T; label?: string }[] | readonly T[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  const opts = options.map((o) => (typeof o === "string" ? { id: o, label: o } : { id: o.id, label: o.label ?? o.id }));
  return (
    <div className={cn("flex flex-wrap gap-x-4 gap-y-1 text-[13px]", className)} role="group" aria-label={label}>
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
            value === o.id ? "text-white" : "text-white/30 hover:text-white/60",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
