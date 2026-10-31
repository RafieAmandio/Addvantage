"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

/** Instrument page for a pair, slash dropped (EUR/USD -> EURUSD). */
export const instrumentHref = (symbol: string) => `/app/instrument/${symbol.replace("/", "")}`;

/** Pair name that links to its instrument page. */
export function PairLink({ symbol, sub }: { symbol: string; sub?: string }) {
  return (
    <Link href={instrumentHref(symbol)} className="group block min-w-0 focus-visible:outline-none">
      <span className="block truncate text-[14px] font-semibold leading-5 text-white group-hover:text-brand group-focus-visible:text-brand">
        {symbol.replace("/", "")}
      </span>
      {sub && <span className="block text-[12px] leading-4 text-white/40">{sub}</span>}
    </Link>
  );
}

/** Multi-select list of zones with a swatch and a count; the zones double as the legend. */
export function ZoneToggles<T extends string>({
  zones,
  active,
  onToggle,
  label,
}: {
  zones: { id: T; label: string; range: string; color: string; count: number }[];
  active: Set<T>;
  onToggle: (id: T) => void;
  label: string;
}) {
  return (
    <ul className="-my-1 divide-y divide-white/[0.07]" aria-label={label}>
      {zones.map((z) => {
        const on = active.has(z.id);
        return (
          <li key={z.id}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(z.id)}
              className="flex w-full items-center gap-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              <span className="h-2 w-2 shrink-0" style={{ backgroundColor: on ? z.color : "rgba(255,255,255,.12)" }} />
              <span className={cn("flex-1 text-[14px] font-medium", on ? "text-white" : "text-white/30")}>{z.label}</span>
              <span className="text-[12px] text-white/30">{z.range}</span>
              <span className={cn("w-8 text-right font-num text-[20px] font-semibold leading-5", on ? "text-white" : "text-white/30")}>{z.count}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Multi-select chips. */
export function ChipToggles<T extends string>({
  options,
  active,
  onToggle,
  label,
}: {
  options: { id: T; label: string }[];
  active: Set<T>;
  onToggle: (id: T) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {options.map((o) => {
        const on = active.has(o.id);
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(o.id)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
              on ? "border-white/25 text-white" : "border-white/[0.08] text-white/30 hover:text-white/60",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Sortable column header. */
export function SortTh<K extends string>({
  k,
  sortKey,
  dir,
  onSort,
  children,
  className,
}: {
  k: K;
  sortKey: K;
  dir: "asc" | "desc";
  onSort: (k: K) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const on = k === sortKey;
  return (
    <th
      className={cn("py-2 pr-3 text-[12px] font-semibold uppercase tracking-[0.08em] last:pr-0", className)}
      aria-sort={on ? (dir === "asc" ? "ascending" : "descending") : undefined}
    >
      <button type="button" onClick={() => onSort(k)} className={cn("uppercase hover:text-white/70", on ? "text-white" : "text-white/40")}>
        {children}
        {on && <span className="ml-1">{dir === "asc" ? "↑" : "↓"}</span>}
      </button>
    </th>
  );
}

/** Centered state line used for loading, errors and empty filters. */
export function StateLine({ children }: { children: React.ReactNode }) {
  return <p className="py-16 text-center text-[14px] text-white/40">{children}</p>;
}

/** Shared sort state for the screener tables. */
export function nextSort<K extends string>(key: K, cur: K, dir: "asc" | "desc", textKey: K): [K, "asc" | "desc"] {
  if (key === cur) return [key, dir === "asc" ? "desc" : "asc"];
  return [key, key === textKey ? "asc" : "desc"];
}

export function sortRows<T, K extends keyof T>(rows: T[], key: K, dir: "asc" | "desc"): T[] {
  return [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === "asc" ? cmp : -cmp;
  });
}

/** Set updater that adds or removes one value. */
export const flip = <T,>(v: T) => (prev: Set<T>) => {
  const next = new Set(prev);
  if (next.has(v)) next.delete(v);
  else next.add(v);
  return next;
};
