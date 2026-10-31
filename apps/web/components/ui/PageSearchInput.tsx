"use client";

import { useEffect } from "react";

export function PageSearchInput({
  value,
  onChange,
  placeholder,
  matchLabel,
  focusKey = "s",
  ariaLabel = "Search",
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  matchLabel?: string | null;
  focusKey?: string;
  ariaLabel?: string;
}) {
  // Unique data attribute so multiple inputs on the same page wouldn't
  // collide. We scope per-component instance with a closure id.
  const inputId = `page-search-${focusKey}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== focusKey) return;
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
      const el = document.getElementById(inputId) as HTMLInputElement | null;
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        requestAnimationFrame(() => el.focus());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusKey, inputId]);

  return (
    <div>
      <div className="flex h-11 items-center gap-3 rounded-full bg-panel px-4 ring-1 ring-white/[0.08] transition-shadow focus-within:ring-brand">
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="shrink-0 text-white/40"
          aria-hidden
        >
          <circle cx="9" cy="9" r="6" />
          <path d="M14 14l4 4" strokeLinecap="round" />
        </svg>
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-white placeholder:text-white/30 outline-none"
          aria-label={ariaLabel}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            title="Clear search"
            aria-label="Clear search"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-raised text-[11px] text-white/60 transition-colors hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            ✕
          </button>
        )}
      </div>
      {matchLabel && value && (
        <div className="px-4 pt-1.5 text-[12px] text-white/40">
          {matchLabel}
        </div>
      )}
    </div>
  );
}
