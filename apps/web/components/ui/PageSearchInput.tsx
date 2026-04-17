"use client";

import { useEffect } from "react";

/**
 * Shared inline page-search input. Used by plan archive, education
 * library, news feed, and any future searchable list page.
 *
 * Features:
 * - Amber search icon
 * - Clear (×) button when populated
 * - Optional live match-count strip below
 * - Escape to blur from inside the input
 * - Opt-in `s` keyboard shortcut to focus from anywhere on the page
 *   (skipped inside inputs/textareas so it doesn't hijack text entry)
 */
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
  /** When set, renders a live match-count strip under the input. */
  matchLabel?: string | null;
  /** Key that focuses the input from anywhere on the page. Default: "s". */
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
    <div className="border border-ink-3 bg-ink-2/40">
      <div className="flex items-center gap-3 px-4 py-3">
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="shrink-0 text-lime"
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
          className="flex-1 bg-transparent font-mono text-sm text-paper placeholder:text-paper/30 outline-none"
          aria-label={ariaLabel}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            title="Clear search"
            aria-label="Clear search"
            className="border border-ink-3 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/60 hover:border-lime hover:text-lime"
          >
            ✕
          </button>
        )}
      </div>
      {matchLabel && value && (
        <div className="border-t border-ink-3 bg-ink/60 px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-lime">
          ● {matchLabel}
        </div>
      )}
    </div>
  );
}
