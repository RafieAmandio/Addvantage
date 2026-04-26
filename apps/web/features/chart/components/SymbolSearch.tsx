"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

export function SymbolSearch({
  symbols,
  current,
  hrefFor,
  className,
}: {
  symbols: readonly string[];
  current: string;
  hrefFor?: (symbol: string) => string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const interval = searchParams?.get("interval") ?? "1h";

  const resolveHref = useMemo(() => {
    if (hrefFor) return hrefFor;
    return (s: string) =>
      `/app/chart/${s}${interval === "1h" ? "" : `?interval=${interval}`}`;
  }, [hrefFor, interval]);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return symbols;
    return symbols.filter((s) => s.toUpperCase().includes(q));
  }, [symbols, query]);

  // Clamp active index when filter shrinks the list.
  useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(0);
  }, [filtered.length, activeIdx]);

  // Global "/" shortcut to focus the input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "/") return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      e.preventDefault();
      inputRef.current?.focus();
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Reset to current when route changes under us.
  useEffect(() => {
    setQuery("");
  }, [pathname]);

  function selectAt(idx: number) {
    const pick = filtered[idx];
    if (!pick) return;
    router.push(resolveHref(pick));
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  }

  return (
    <div
      className={cn(
        "relative font-mono text-[10px] uppercase tracking-widest2",
        className,
      )}
    >
      <div className="flex items-center gap-2 border border-gray-3 bg-gray-2 px-2 py-1">
        <span aria-hidden className="text-brand">
          /
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIdx(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Delay close so click on option still registers.
            window.setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActiveIdx((i) => (filtered.length ? (i + 1) % filtered.length : 0));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              setActiveIdx((i) =>
                filtered.length ? (i - 1 + filtered.length) % filtered.length : 0,
              );
            } else if (e.key === "Enter") {
              e.preventDefault();
              selectAt(activeIdx);
            } else if (e.key === "Escape") {
              e.preventDefault();
              setOpen(false);
              setQuery("");
              inputRef.current?.blur();
            }
          }}
          placeholder={current}
          aria-label="Search symbols"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open}
          role="combobox"
          className="w-24 bg-transparent text-white placeholder:text-white/40 outline-none"
        />
      </div>
      {open && filtered.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 border border-gray-3 bg-gray-2"
        >
          {filtered.map((s, idx) => {
            const active = idx === activeIdx;
            const isCurrent = s === current;
            return (
              <li
                key={s}
                role="option"
                aria-selected={active}
                onMouseDown={(e) => {
                  // Prevent input blur before click handler runs.
                  e.preventDefault();
                  selectAt(idx);
                }}
                onMouseEnter={() => setActiveIdx(idx)}
                className={cn(
                  "cursor-pointer px-2 py-1 transition-colors",
                  active
                    ? "bg-brand text-black"
                    : isCurrent
                      ? "text-brand"
                      : "text-white/70 hover:text-brand",
                )}
              >
                {s}
              </li>
            );
          })}
        </ul>
      )}
      {open && filtered.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 border border-gray-3 bg-gray-2 px-2 py-1 text-white/40">
          no match
        </div>
      )}
    </div>
  );
}
