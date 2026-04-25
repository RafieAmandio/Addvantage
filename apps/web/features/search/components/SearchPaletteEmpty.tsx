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
          <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
            ● Where you were
          </div>
          <div className="mt-3 grid grid-cols-1 gap-px bg-gray-3 sm:grid-cols-2">
            {visits.map((v) => (
              <button
                key={v.href}
                onClick={() => onJump(v.href)}
                className="group flex items-center justify-between bg-black p-3 text-left transition-colors hover:bg-gray-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[9px] uppercase tracking-widest2 text-brand">
                    {v.kind}
                  </div>
                  <div className="mt-0.5 truncate text-sm text-white transition-colors group-hover:text-brand">
                    {v.label}
                  </div>
                </div>
                <span className="ml-3 shrink-0 font-mono text-[9px] uppercase tracking-widest2 text-white/30 group-hover:text-brand">
                  →
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="mb-6">
          <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
            ● Recent transmissions
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {recent.map((q) => (
              <button
                key={q}
                onClick={() => onPick(q)}
                className="border border-gray-3 bg-black px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-white/70 hover:border-brand hover:text-brand"
              >
                {q}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          ● Try
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SEARCH_SUGGESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => onPick(q)}
              className="border border-brand/30 bg-brand/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black"
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-px bg-gray-3 sm:grid-cols-2">
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
    <div className="flex items-center justify-between bg-black p-3">
      <span className="font-mono text-[10px] uppercase tracking-widest2 text-white/60">
        {label}
      </span>
      <span className="flex items-center gap-1">
        {alt && (
          <>
            <kbd className="border border-brand/30 bg-gray-2 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/60">
              {alt}
            </kbd>
            <span className="text-white/30">/</span>
          </>
        )}
        {chord.split(" ").map((k, i) => (
          <kbd
            key={i}
            className="border border-brand/40 bg-gray-2 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-brand"
          >
            {k}
          </kbd>
        ))}
      </span>
    </div>
  );
}
