"use client";

import { cn } from "@/lib/cn";

export function FilterChips({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-px bg-gray-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 transition-colors",
            value === opt.value
              ? "bg-lime text-ink"
              : "bg-gray-2 text-paper/60 hover:text-paper"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
