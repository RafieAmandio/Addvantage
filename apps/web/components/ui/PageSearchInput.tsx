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
    <div className="border border-gray-3 bg-gray-2/40 transition-colors focus-within:border-brand">
      <div className="flex items-center gap-3 px-4 py-3">
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="shrink-0 text-brand"
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
          className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-white/30 outline-none"
          aria-label={ariaLabel}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            title="Clear search"
            aria-label="Clear search"
            className="border border-gray-3 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            ✕
          </button>
        )}
      </div>
      {matchLabel && value && (
        <div className="border-t border-gray-3 bg-black/60 px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-brand">
          ● {matchLabel}
        </div>
      )}
    </div>
  );
}
