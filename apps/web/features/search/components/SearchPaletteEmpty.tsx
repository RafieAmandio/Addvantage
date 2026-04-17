"use client";

import type { RecentVisit } from "@/lib/visits";
import { SEARCH_SUGGESTIONS } from "@/features/search/lib/suggestions";

interface SearchPaletteEmptyProps {
  recent: string[];
  visits: RecentVisit[];
  onPick: (q: string) => void;
  onJump: (href: string) => void;
}

export function SearchPaletteEmpty({
  recent,
  visits,
  onPick,
  onJump,
}: SearchPaletteEmptyProps) {
  return (
    <div className="p-6">
      {visits.length > 0 && (
        <section className="mb-6">
          <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
            ● Where you were
          </div>
          <div className="mt-3 grid grid-cols-1 gap-px bg-ink-3 sm:grid-cols-2">
            {visits.map((v) => (
              <button
                key={v.href}
                onClick={() => onJump(v.href)}
                className="group flex items-center justify-between bg-ink p-3 text-left transition-colors hover:bg-ink-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[9px] uppercase tracking-widest2 text-lime">
                    {v.kind}
                  </div>
                  <div className="mt-0.5 truncate text-sm text-paper transition-colors group-hover:text-lime">
                    {v.label}
                  </div>
                </div>
                <span className="ml-3 shrink-0 font-mono text-[9px] uppercase tracking-widest2 text-paper/30 group-hover:text-lime">
                  →
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="mb-6">
          <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
            ● Recent transmissions
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {recent.map((q) => (
              <button
                key={q}
                onClick={() => onPick(q)}
                className="border border-ink-3 bg-ink px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-paper/70 hover:border-lime hover:text-lime"
              >
                {q}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
          ● Try
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SEARCH_SUGGESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => onPick(q)}
              className="border border-lime/30 bg-lime/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-px bg-ink-3 sm:grid-cols-2">
        <Tip
          chord="Cmd K"
          alt="Ctrl K"
          label="Open this palette from anywhere"
        />
        <Tip chord="/" label="Same — single key" />
        <Tip chord="↑ ↓" label="Move between results" />
        <Tip chord="↵" label="Open the highlighted result" />
        <Tip chord="esc" label="Close" />
        <Tip chord="?" label="See all keyboard shortcuts" />
      </div>
    </div>
  );
}

function Tip({
  chord,
  alt,
  label,
}: {
  chord: string;
  alt?: string;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between bg-ink p-3">
      <span className="font-mono text-[10px] uppercase tracking-widest2 text-paper/60">
        {label}
      </span>
      <span className="flex items-center gap-1">
        {alt && (
          <>
            <kbd className="border border-lime/30 bg-ink-2 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/60">
              {alt}
            </kbd>
            <span className="text-paper/30">/</span>
          </>
        )}
        {chord.split(" ").map((k, i) => (
          <kbd
            key={i}
            className="border border-lime/40 bg-ink-2 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-lime"
          >
            {k}
          </kbd>
        ))}
      </span>
    </div>
  );
}
